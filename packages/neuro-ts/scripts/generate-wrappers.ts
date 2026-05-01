/**
 * neuro-ts wrapper generator.
 *
 * Walks `lib.*.d.ts` (TypeScript bundled or `TS_LIB_DIR` override) using the
 * Compiler API, finds every method on every whitelisted built-in interface
 * (see `./builtins.ts`), and emits one **group file per built-in** under
 * `src/generated/groups/<group>.ts`. Each group file exports a typed object
 * named after the group, e.g. `math`, `array`, `string`. The library
 * `src/index.ts` then assembles those groups into the public `neuro`
 * namespace.
 *
 * Public shape (post 0.1.0): every wrapper is invoked as
 *
 *     neuro.<group>.<method>({
 *       <receiverKey>: ...,    // instance methods only
 *       <param1>:      ...,
 *       <param2>:      ...,
 *       prompt?: string,
 *     })
 *
 * The trailing-string positional API is gone. The runtime in `runtime.ts`
 * extracts the `prompt` key, projects the rest back to positional native
 * arguments via `paramOrder`, and dispatches.
 *
 * Each generated method also gets a typed entry in `prompts.json` (consumed
 * by the docs site). The generator imports `./prompts/<group>.ts` and
 * **hard-fails** when any method lacks a per-method entry, so the build
 * cannot ship a wrapper with no curated prompt.
 *
 * Run via `pnpm generate`. Idempotent + deterministic: CI verifies no diff.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { BUILTINS, GLOBAL_FUNCTIONS, type BuiltinSpec } from './builtins';
import { loadPrompts, type CuratedPrompt } from './prompts/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PKG_ROOT = path.resolve(__dirname, '..');
const SRC_GENERATED = path.resolve(PKG_ROOT, 'src/generated');
const GROUPS_DIR = path.join(SRC_GENERATED, 'groups');
const PROMPTS_JSON = path.resolve(SRC_GENERATED, 'prompts.json');

interface MethodOverload {
  /** Object-literal type for the input arg, e.g. `{ array: T[]; callbackfn: ... ; prompt?: string }`. */
  inputType: string;
  /** Promise-wrapped return type. */
  returnType: string;
  /** Generic type parameters declared on this overload (if any). */
  typeParams: string;
  /** Hint sent to the LLM. */
  signatureHint: { name: string; type: string }[];
  jsDoc: string;
  /** Pretty-printed parameter list for system-prompt + docs (without prompt). */
  paramSummary: string;
  /** Native return type (without Promise<>). */
  nativeReturnType: string;
}

interface CollectedMethod {
  spec: BuiltinSpec;
  /** original JS method name (e.g. `map`) */
  methodName: string;
  /** Group, lower-cased (e.g. `array`) */
  group: string;
  overloads: MethodOverload[];
  /** Combined system prompt the wrapper sends to the LLM. */
  systemPrompt: string;
  functionId: string;
  /** Native fallback dotted path (e.g. `Array.prototype.map`). */
  nativeRoot: string;
  /** Receiver key for instance methods (e.g. `array`); empty otherwise. */
  receiverKey: string;
  /**
   * Ordered list of native parameter names (including the variadic param's
   * name when present). The runtime walks this list to project the named
   * input back to positional native args.
   */
  paramOrder: string[];
  /** Variadic parameter name; empty when fixed-arity. */
  variadicKey: string;
}

const VALID_IDENT = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
// Names we never wrap (lifecycle / Object internals - noisy and unhelpful).
const SKIP_METHODS = new Set([
  'constructor',
  'toString',
  'valueOf',
  'toLocaleString',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  '__proto__',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);
// Per-interface skip list (exact matches).
const SKIP_BY_INTERFACE = new Map<string, Set<string>>([
  // `getVarDate` is legacy IE; `toTemporalInstant` references the unstable
  // Temporal global which is not in our default lib.
  ['Date', new Set(['getVarDate', 'toTemporalInstant'])],
]);

function writeIfChanged(file: string, content: string): boolean {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) {
    const cur = fs.readFileSync(file, 'utf8');
    if (cur === content) return false;
  }
  fs.writeFileSync(file, content);
  return true;
}

function listLibFiles(): string[] {
  const override = process.env.TS_LIB_DIR;
  if (override) {
    return fs
      .readdirSync(override)
      .filter((f) => f.endsWith('.d.ts') && f.startsWith('lib.'))
      .map((f) => path.join(override, f));
  }
  const defaultDir = path.dirname(ts.getDefaultLibFilePath({ target: ts.ScriptTarget.ESNext }));
  return fs
    .readdirSync(defaultDir)
    .filter(
      (f) =>
        f.endsWith('.d.ts') &&
        f.startsWith('lib.') &&
        !f.includes('.full.') &&
        !f.startsWith('lib.dom.') &&
        !f.startsWith('lib.webworker.') &&
        !f.startsWith('lib.scripthost'),
    )
    .map((f) => path.join(defaultDir, f));
}

function looksLikeCallback(name: string, typeText: string): boolean {
  const lname = name.toLowerCase();
  return (
    lname === 'callback' ||
    lname === 'callbackfn' ||
    lname === 'predicate' ||
    lname === 'comparefn' ||
    lname === 'mapfn' ||
    lname === 'reviver' ||
    lname === 'replacer' ||
    /=>/.test(typeText)
  );
}

const TYPED_ARRAY_NAMES = [
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array',
  'ArrayBuffer',
  'SharedArrayBuffer',
];

const TYPED_ARRAY_GENERIC_RE = new RegExp(`\\b(${TYPED_ARRAY_NAMES.join('|')})<[^<>]*>`, 'g');

function simplifyTypeText(text: string): string {
  let out = text.replace(/=>\s*[\w$]+\s+is\s+[\w$<>,\s.]+/g, '=> boolean');
  // Strip concrete generic args (e.g. `Uint8Array<ArrayBuffer>` -> `Uint8Array`).
  out = out.replace(TYPED_ARRAY_GENERIC_RE, '$1');
  return out;
}

function getJsDocSummary(decl: ts.SignatureDeclaration): string {
  const jsDocs = ts.getJSDocCommentsAndTags(decl);
  for (const jd of jsDocs) {
    if (ts.isJSDoc(jd)) {
      let text = '';
      if (typeof jd.comment === 'string') {
        text = jd.comment;
      } else if (jd.comment) {
        text = ts.getTextOfJSDocComment(jd.comment) ?? '';
      }
      if (text && text.trim()) {
        return text.trim().replace(/[\u2014\u2013\u2212]/g, '-');
      }
    }
  }
  return '';
}

function buildSystemPrompt(
  spec: BuiltinSpec,
  methodName: string,
  overloads: MethodOverload[],
): string {
  const sigLines = overloads
    .map((o, i) => `  Overload ${i + 1}: (${o.paramSummary}) => ${o.nativeReturnType}`)
    .join('\n');
  const jsDoc = overloads.find((o) => o.jsDoc)?.jsDoc ?? '';
  const idForLlm = `${spec.functionIdPrefix}.${methodName}`;
  return [
    `You are simulating the JavaScript built-in \`${idForLlm}\`.`,
    ``,
    `## Original signature(s)`,
    sigLines,
    ``,
    jsDoc ? `## JSDoc\n${jsDoc}\n` : '',
    `## How to respond`,
    `- Behave EXACTLY as the original \`${methodName}\` would, but use the user's intent to choose any callback / comparator / transform logic that the original would normally accept as an argument.`,
    `- Strictly preserve the original return type and shape.`,
    `- Output ONLY the JSON-encoded return value of the function call.`,
    `- Do NOT include explanations, prose, comments, or markdown fences.`,
    `- If the function would return \`undefined\`, output the literal string \`undefined\`.`,
    `- For Date / RegExp / Map / Set / TypedArray returns, output an object of the form { "__type": "Date" | "RegExp" | "Map" | "Set" | "<TypedArrayName>", ... } so the SDK can rehydrate it.`,
  ]
    .filter((l) => l !== '')
    .join('\n');
}

function findInterfaceSymbols(program: ts.Program, names: Set<string>): Map<string, ts.Symbol> {
  const checker = program.getTypeChecker();
  const out = new Map<string, ts.Symbol>();
  for (const sf of program.getSourceFiles()) {
    ts.forEachChild(sf, (node) => {
      if (ts.isInterfaceDeclaration(node) && names.has(node.name.text)) {
        const sym = checker.getSymbolAtLocation(node.name);
        if (sym && !out.has(node.name.text)) out.set(node.name.text, sym);
      }
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && names.has(decl.name.text)) {
            const sym = checker.getSymbolAtLocation(decl.name);
            if (sym && !out.has(decl.name.text)) out.set(decl.name.text, sym);
          }
        }
      }
    });
  }
  return out;
}

function findGlobalFunctions(
  program: ts.Program,
  names: Set<string>,
): Map<string, ts.FunctionDeclaration> {
  const out = new Map<string, ts.FunctionDeclaration>();
  for (const sf of program.getSourceFiles()) {
    ts.forEachChild(sf, (node) => {
      if (
        ts.isFunctionDeclaration(node) &&
        node.name &&
        names.has(node.name.text) &&
        !out.has(node.name.text)
      ) {
        out.set(node.name.text, node);
      }
    });
  }
  return out;
}

function isFunctionLikeType(checker: ts.TypeChecker, type: ts.Type): boolean {
  return checker.getSignaturesOfType(type, ts.SignatureKind.Call).length > 0;
}

interface FormattedParam {
  /** Parameter name as declared in the TS lib (may be empty for unnamed). */
  name: string;
  /** Type text (post-simplification). */
  typeText: string;
  optional: boolean;
  rest: boolean;
}

function formatParameter(checker: ts.TypeChecker, p: ts.Symbol): FormattedParam {
  const decl = p.valueDeclaration as ts.ParameterDeclaration | undefined;
  const type = checker.getTypeOfSymbolAtLocation(
    p,
    decl ?? (p.declarations?.[0] as ts.Declaration),
  );
  const typeText = simplifyTypeText(
    checker.typeToString(
      type,
      decl,
      ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType,
    ),
  );
  const name = p.getName();
  const isRest = decl ? !!decl.dotDotDotToken : false;
  const isOptOriginal = decl ? checker.isOptionalParameter(decl) : false;
  const isCallback = looksLikeCallback(name, typeText) || isFunctionLikeType(checker, type);
  const optional = isOptOriginal || isCallback;
  return { name, typeText, optional, rest: isRest };
}

function rebalanceOptionality(params: FormattedParam[]): FormattedParam[] {
  let seenOptional = false;
  return params.map((p) => {
    if (p.rest) return p;
    if (p.optional) {
      seenOptional = true;
      return p;
    }
    if (seenOptional) {
      return { ...p, optional: true };
    }
    return p;
  });
}

/**
 * Rename any parameter whose name collides with the receiver key so the
 * input object literal does not produce a duplicate-property type. The
 * disambiguator is `<name>_arg` (e.g. `Date.prototype.setDate(date)` ->
 * `{ date, date_arg }`). The rename is applied in `paramOrder` too so
 * the native dispatch reads from the new key.
 */
function disambiguateParams(receiverKey: string, params: FormattedParam[]): FormattedParam[] {
  if (!receiverKey) return params;
  return params.map((p) => (p.name === receiverKey ? { ...p, name: `${p.name}_arg` } : p));
}

function getInterfaceTypeParams(ifaceSymbol: ts.Symbol): string[] {
  const decls = ifaceSymbol.getDeclarations() ?? [];
  for (const d of decls) {
    if (ts.isInterfaceDeclaration(d) && d.typeParameters) {
      return d.typeParameters.map((tp) => tp.getText());
    }
  }
  return [];
}

/**
 * Render a single overload's input object literal type. The receiver key
 * (instance methods only) comes first; then each native parameter; then
 * an optional `prompt`. Variadic params are typed as a tuple's element-type
 * array.
 */
function buildInputTypeText(
  receiverKey: string,
  receiverType: string,
  params: FormattedParam[],
): string {
  const lines: string[] = [];
  if (receiverKey) {
    lines.push(`${receiverKey}: ${receiverType}`);
  }
  for (const p of params) {
    if (!p.name) continue;
    if (p.rest) {
      const arr = /^(.+)\[\]$/.exec(p.typeText.trim());
      const elementType = arr ? arr[1].trim() : p.typeText;
      lines.push(`${p.name}?: (${elementType})[]`);
    } else {
      lines.push(`${p.name}${p.optional ? '?' : ''}: ${p.typeText}`);
    }
  }
  lines.push(`prompt?: string`);
  return `{ ${lines.join('; ')} }`;
}

function paramSummaryFor(params: FormattedParam[]): string {
  return params
    .map((p) =>
      p.rest
        ? `...${p.name || 'args'}: ${p.typeText}`
        : `${p.name || 'arg'}${p.optional ? '?' : ''}: ${p.typeText}`,
    )
    .join(', ');
}

function collectMethodsFromInterface(
  program: ts.Program,
  spec: BuiltinSpec,
  ifaceSymbol: ts.Symbol,
): CollectedMethod[] {
  const checker = program.getTypeChecker();
  const declType = checker.getDeclaredTypeOfSymbol(ifaceSymbol);
  const props = checker.getPropertiesOfType(declType);
  const grouped = new Map<string, ts.Symbol[]>();
  // Interface-level generics inherited by methods.
  const interfaceTypeParams = getInterfaceTypeParams(ifaceSymbol);
  const interfaceTypeParamNames = interfaceTypeParams.map((s) => s.match(/^([\w$]+)/)?.[1] ?? '');

  for (const sym of props) {
    const name = sym.getName();
    if (!VALID_IDENT.test(name)) continue;
    if (SKIP_METHODS.has(name)) continue;
    const ifaceSkip = SKIP_BY_INTERFACE.get(spec.interface);
    if (ifaceSkip?.has(name)) continue;
    const decl = sym.valueDeclaration;
    if (!decl) continue;
    if (
      !(ts.isMethodSignature(decl) || ts.isMethodDeclaration(decl) || ts.isPropertySignature(decl))
    )
      continue;
    const ofType = checker.getTypeOfSymbolAtLocation(sym, decl);
    if (checker.getSignaturesOfType(ofType, ts.SignatureKind.Call).length === 0) continue;
    if (!grouped.has(name)) grouped.set(name, []);
    grouped.get(name)!.push(sym);
  }

  const out: CollectedMethod[] = [];
  for (const [methodName, syms] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const overloads: MethodOverload[] = [];
    const paramOrder: string[] = [];
    let variadicKey = '';

    for (const sym of syms) {
      const decl = sym.valueDeclaration!;
      const ofType = checker.getTypeOfSymbolAtLocation(sym, decl);
      const sigs = checker.getSignaturesOfType(ofType, ts.SignatureKind.Call);

      for (const sig of sigs) {
        const sigDecl = sig.getDeclaration();
        const typeParamStrings: string[] = [];
        if (
          sigDecl &&
          (ts.isMethodSignature(sigDecl) || ts.isMethodDeclaration(sigDecl)) &&
          sigDecl.typeParameters
        ) {
          for (const tp of sigDecl.typeParameters) typeParamStrings.push(tp.getText());
        }
        if (spec.kind === 'instance') {
          const need = (spec.instanceType ?? '').match(/<([^>]+)>/);
          if (need) {
            const required = need[1].split(',').map((s) => s.trim());
            for (const r of required) {
              if (
                !typeParamStrings.some(
                  (s) =>
                    s === r ||
                    s.startsWith(`${r} `) ||
                    s.startsWith(`${r},`) ||
                    s.startsWith(`${r}<`) ||
                    s.startsWith(`${r} extends`),
                )
              ) {
                typeParamStrings.unshift(r);
              }
            }
          } else if (spec.instanceType === 'T[]') {
            if (
              !typeParamStrings.some(
                (s) =>
                  s === 'T' ||
                  s.startsWith('T ') ||
                  s.startsWith('T<') ||
                  s.startsWith('T,') ||
                  s.startsWith('T extends'),
              )
            ) {
              typeParamStrings.unshift('T');
            }
          }
        }

        const params = sig.getParameters();
        const receiverKeyForSig = spec.kind === 'instance' ? (spec.receiverKey ?? '') : '';
        const formattedParams = disambiguateParams(
          receiverKeyForSig,
          rebalanceOptionality(params.map((p) => formatParameter(checker, p))),
        );
        const ret = checker.getReturnTypeOfSignature(sig);
        const retText = simplifyTypeText(
          checker.typeToString(ret, undefined, ts.TypeFormatFlags.NoTruncation),
        );

        // WeakMap / WeakSet require K/T to extend WeakKey on the per-method generics.
        const constrainedTypeParams = typeParamStrings.map((tp) => {
          if (spec.interface === 'WeakMap' && (tp === 'K' || tp.startsWith('K ')))
            return tp.includes('extends') ? tp : 'K extends WeakKey';
          if (spec.interface === 'WeakSet' && (tp === 'T' || tp.startsWith('T ')))
            return tp.includes('extends') ? tp : 'T extends WeakKey';
          return tp;
        });

        // Hoist interface-level generics referenced anywhere in the
        // method's signature so the wrapper can infer them from the
        // supplied receiver / args.
        const referencedInterfaceParams: string[] = [];
        const haystack = `${formattedParams.map((p) => `${p.name} ${p.typeText}`).join(' ')} ${retText} ${spec.instanceType ?? ''}`;
        for (let i = 0; i < interfaceTypeParamNames.length; i += 1) {
          const name = interfaceTypeParamNames[i];
          if (!name) continue;
          const re = new RegExp(`\\b${name}\\b`);
          if (
            re.test(haystack) &&
            !constrainedTypeParams.some(
              (s) =>
                s === name ||
                s.startsWith(`${name} `) ||
                s.startsWith(`${name},`) ||
                s.startsWith(`${name}<`) ||
                s.startsWith(`${name} extends`),
            )
          ) {
            referencedInterfaceParams.push(interfaceTypeParams[i]);
          }
        }
        const allTypeParams = [...constrainedTypeParams, ...referencedInterfaceParams];
        const tParams = allTypeParams.length > 0 ? `<${allTypeParams.join(', ')}>` : '';

        let instanceTypeText = spec.instanceType ?? '';
        if (
          spec.kind === 'instance' &&
          referencedInterfaceParams.length > 0 &&
          !instanceTypeText.includes('<')
        ) {
          const refNames = referencedInterfaceParams
            .map((s) => s.match(/^([\w$]+)/)?.[1])
            .filter(Boolean);
          if (refNames.length > 0) instanceTypeText = `${instanceTypeText}<${refNames.join(', ')}>`;
        }

        // Collect names (including the variadic name) into paramOrder.
        for (const p of formattedParams) {
          if (!p.name) continue;
          if (!paramOrder.includes(p.name)) paramOrder.push(p.name);
          if (p.rest) {
            if (!variadicKey) variadicKey = p.name;
          }
        }

        const receiverKey = spec.kind === 'instance' ? (spec.receiverKey ?? '') : '';
        const inputType = buildInputTypeText(receiverKey, instanceTypeText, formattedParams);

        const promiseRetText = retText.startsWith('Promise<') ? retText : `Promise<${retText}>`;

        const hint = formattedParams.map((p) => ({
          name: `${p.name}${p.optional ? '?' : ''}`,
          type: p.typeText,
        }));

        overloads.push({
          inputType,
          returnType: promiseRetText,
          typeParams: tParams,
          signatureHint: hint,
          jsDoc: getJsDocSummary(sigDecl ?? (decl as ts.SignatureDeclaration)),
          paramSummary: paramSummaryFor(formattedParams),
          nativeReturnType: retText,
        });
      }
    }
    if (overloads.length === 0) continue;

    const functionId = `${spec.functionIdPrefix}.${methodName}`;
    const nativeRoot = `${spec.nativeRoot}.${methodName}`;
    const receiverKey = spec.kind === 'instance' ? (spec.receiverKey ?? '') : '';

    out.push({
      spec,
      methodName,
      group: spec.group,
      overloads,
      systemPrompt: buildSystemPrompt(spec, methodName, overloads),
      functionId,
      nativeRoot,
      receiverKey,
      paramOrder,
      variadicKey,
    });
  }
  return out;
}

function collectGlobalFunction(
  program: ts.Program,
  decl: ts.FunctionDeclaration,
  name: string,
): CollectedMethod | null {
  const checker = program.getTypeChecker();
  const sym = checker.getSymbolAtLocation(decl.name!);
  if (!sym) return null;
  const type = checker.getTypeOfSymbolAtLocation(sym, decl);
  const sigs = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
  const overloads: MethodOverload[] = [];
  const paramOrder: string[] = [];
  let variadicKey = '';

  for (const sig of sigs) {
    const sigDecl = sig.getDeclaration();
    const typeParamStrings: string[] = [];
    if (sigDecl && ts.isFunctionDeclaration(sigDecl) && sigDecl.typeParameters) {
      for (const tp of sigDecl.typeParameters) typeParamStrings.push(tp.getText());
    }
    const params = sig.getParameters();
    const formattedParams = rebalanceOptionality(params.map((p) => formatParameter(checker, p)));
    const ret = checker.getReturnTypeOfSignature(sig);
    const retText = simplifyTypeText(
      checker.typeToString(ret, undefined, ts.TypeFormatFlags.NoTruncation),
    );

    for (const p of formattedParams) {
      if (!p.name) continue;
      if (!paramOrder.includes(p.name)) paramOrder.push(p.name);
      if (p.rest && !variadicKey) variadicKey = p.name;
    }

    const tParams = typeParamStrings.length > 0 ? `<${typeParamStrings.join(', ')}>` : '';
    const inputType = buildInputTypeText('', '', formattedParams);
    const promiseRetText = retText.startsWith('Promise<') ? retText : `Promise<${retText}>`;

    overloads.push({
      inputType,
      returnType: promiseRetText,
      typeParams: tParams,
      signatureHint: formattedParams.map((p) => ({
        name: `${p.name}${p.optional ? '?' : ''}`,
        type: p.typeText,
      })),
      jsDoc: getJsDocSummary(sigDecl ?? decl),
      paramSummary: paramSummaryFor(formattedParams),
      nativeReturnType: retText,
    });
  }
  if (overloads.length === 0) return null;
  const fakeSpec: BuiltinSpec = {
    interface: '__global__',
    group: 'globals',
    kind: 'static',
    functionIdPrefix: 'globalThis',
    nativeRoot: 'globalThis',
  };
  return {
    spec: fakeSpec,
    methodName: name,
    group: 'globals',
    overloads,
    systemPrompt: buildSystemPrompt(fakeSpec, name, overloads),
    functionId: `globalThis.${name}`,
    nativeRoot: `globalThis.${name}`,
    receiverKey: '',
    paramOrder,
    variadicKey,
  };
}

const RESERVED_WORDS = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'let',
  'static',
  'await',
  'async',
]);

function safeIdentifier(name: string): string {
  return RESERVED_WORDS.has(name) ? `_${name}` : name;
}

function emitGroupFile(
  group: string,
  methods: CollectedMethod[],
): { file: string; content: string } {
  const file = path.join(GROUPS_DIR, `${group}.ts`);
  const sorted = methods.slice().sort((a, b) => a.methodName.localeCompare(b.methodName));

  const blocks: string[] = [];
  const reservedReexports: string[] = [];

  for (const [i, m] of sorted.entries()) {
    const specVar = `__${m.methodName}_${i}_spec`;
    const escapedSystemPrompt = m.systemPrompt
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');
    const safeName = safeIdentifier(m.methodName);
    const isReserved = safeName !== m.methodName;
    const exportKw = isReserved ? '' : 'export ';

    const declarations: string[] = [];
    for (const o of m.overloads) {
      declarations.push(
        `${exportKw}function ${safeName}${o.typeParams}(input: ${o.inputType}): ${o.returnType};`,
      );
    }

    blocks.push(
      `/** \`${m.functionId}\` - pass an object literal with a \`prompt\` field to route through the LLM, or omit \`prompt\` to fall back to the native built-in. */
const ${specVar}: GeneratedMethodSpec = {
  group: '${m.group}',
  methodName: '${m.methodName}',
  functionId: '${m.functionId}',
  kind: '${m.spec.kind}',
  native: resolveNative('${m.nativeRoot}'),
  receiverKey: ${JSON.stringify(m.receiverKey)},
  paramOrder: ${JSON.stringify(m.paramOrder)},
  variadicKey: ${JSON.stringify(m.variadicKey)},
  systemPrompt: \`${escapedSystemPrompt}\`,
  signatureHint: ${JSON.stringify(m.overloads[0]?.signatureHint ?? [])},
};
${declarations.join('\n')}
${exportKw}async function ${safeName}(input: Record<string, unknown>): Promise<unknown> { return runMethod(${specVar}, input); }`,
    );

    if (isReserved) reservedReexports.push(`export { ${safeName} as ${m.methodName} };`);
  }

  const content = `// Auto-generated by scripts/generate-wrappers.ts. Do not edit.
import { runMethod, resolveNative, type GeneratedMethodSpec } from '../../runtime';

${blocks.join('\n\n')}

${reservedReexports.join('\n')}
`;

  return { file, content };
}

function emitGlobalsFile(methods: CollectedMethod[]): {
  file: string;
  content: string;
} {
  const file = path.join(GROUPS_DIR, 'globals.ts');
  const sorted = methods.slice().sort((a, b) => a.methodName.localeCompare(b.methodName));

  const declLines: string[] = [];
  const specLines: string[] = [];

  for (const [i, m] of sorted.entries()) {
    const specVar = `__${m.methodName}_${i}_spec`;
    const escapedSystemPrompt = m.systemPrompt
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');
    specLines.push(
      `const ${specVar}: GeneratedMethodSpec = {
  group: 'globals',
  methodName: '${m.methodName}',
  functionId: '${m.functionId}',
  kind: 'global',
  native: resolveNative('${m.nativeRoot}'),
  receiverKey: '',
  paramOrder: ${JSON.stringify(m.paramOrder)},
  variadicKey: ${JSON.stringify(m.variadicKey)},
  systemPrompt: \`${escapedSystemPrompt}\`,
  signatureHint: ${JSON.stringify(m.overloads[0]?.signatureHint ?? [])},
};`,
    );
    for (const o of m.overloads) {
      declLines.push(
        `export function ${m.methodName}${o.typeParams}(input: ${o.inputType}): ${o.returnType};`,
      );
    }
    declLines.push(
      `export async function ${m.methodName}(input: Record<string, unknown>): Promise<unknown> { return runMethod(${specVar}, input); }`,
    );
    declLines.push('');
  }

  const content = `// Auto-generated by scripts/generate-wrappers.ts. Do not edit.
import { runMethod, resolveNative, type GeneratedMethodSpec } from '../../runtime';

${specLines.join('\n\n')}

${declLines.join('\n')}
`;
  return { file, content };
}

function emitGroupsIndex(groupNames: string[]): {
  file: string;
  content: string;
} {
  const file = path.join(GROUPS_DIR, 'index.ts');
  const lines = groupNames
    .sort()
    .map((g) =>
      g === 'globals' ? `export * from './globals';` : `export * as ${g} from './${g}';`,
    )
    .join('\n');
  return { file, content: `// Auto-generated. Do not edit.\n${lines}\n` };
}

function emitNeuroNamespace(groupNames: string[]): {
  file: string;
  content: string;
} {
  const file = path.join(SRC_GENERATED, 'neuro.ts');
  const namespaceGroups = groupNames.filter((g) => g !== 'globals').sort();
  const groupImports = namespaceGroups
    .map((g) => `import * as ${g} from './groups/${g}';`)
    .join('\n');
  const globalImport = groupNames.includes('globals')
    ? `import * as globals from './groups/globals';`
    : '';
  const objectFields = namespaceGroups.map((g) => `  ${g},`).join('\n');
  const globalSpread = groupNames.includes('globals') ? '  ...globals,' : '';

  const content = `// Auto-generated. Do not edit.
${groupImports}
${globalImport}

/**
 * The \`neuro\` umbrella. Group methods by built-in (\`neuro.math.random\`,
 * \`neuro.array.map\`, \`neuro.string.split\`, ...). Globals such as
 * \`parseInt\` live at the top level (\`neuro.parseInt\`).
 *
 * Every method takes a single object literal whose keys mirror the original
 * built-in's parameter names plus an optional \`prompt: string\`. With a
 * non-empty \`prompt\`: routed to the configured LLM. Without one (or with
 * an empty string): dispatched to the native built-in.
 */
export const neuro = {
${objectFields}
${globalSpread}
};

export type NeuroNamespace = typeof neuro;
`;
  return { file, content };
}

function generatePromptsJson(
  methods: CollectedMethod[],
  curated: Map<string, CuratedPrompt>,
): string {
  const out: Record<string, unknown> = {};
  for (const m of methods
    .slice()
    .sort((a, b) => `${a.group}.${a.methodName}`.localeCompare(`${b.group}.${b.methodName}`))) {
    const key =
      m.spec.kind === 'static' && m.group === 'globals'
        ? `neuro.${m.methodName}`
        : `neuro.${m.group}.${m.methodName}`;
    const c = curated.get(key);
    out[key] = {
      group: m.group,
      methodName: m.methodName,
      functionId: m.functionId,
      kind: m.spec.kind,
      receiverKey: m.receiverKey,
      paramOrder: m.paramOrder,
      variadicKey: m.variadicKey,
      overloads: m.overloads.map((o) => ({
        params: o.paramSummary,
        returnType: o.nativeReturnType,
        jsDoc: o.jsDoc,
      })),
      systemPrompt: m.systemPrompt,
      curated: c
        ? {
            prompt: c.prompt,
            comment: c.comment,
            example: c.example,
          }
        : null,
    };
  }
  return `${JSON.stringify(out, null, 2)}\n`;
}

function clearGenerated(): void {
  if (!fs.existsSync(SRC_GENERATED)) return;
  for (const entry of fs.readdirSync(SRC_GENERATED)) {
    const full = path.join(SRC_GENERATED, entry);
    fs.rmSync(full, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  console.log('[neuro-ts] generating wrappers...');
  const libFiles = listLibFiles();
  console.log(`[neuro-ts] loaded ${libFiles.length} lib.*.d.ts files`);

  const program = ts.createProgram(libFiles, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    noEmit: true,
    skipLibCheck: true,
    strict: false,
  });

  const ifaceNames = new Set(BUILTINS.map((b) => b.interface));
  const ifaceSymbols = findInterfaceSymbols(program, ifaceNames);
  const missing = [...ifaceNames].filter((n) => !ifaceSymbols.has(n));
  if (missing.length > 0)
    console.warn(`[neuro-ts] interface symbols not found: ${missing.join(', ')}`);

  clearGenerated();

  const allMethodsByGroup = new Map<string, CollectedMethod[]>();

  for (const spec of BUILTINS) {
    const sym = ifaceSymbols.get(spec.interface);
    if (!sym) continue;
    const collected = collectMethodsFromInterface(program, spec, sym);
    if (!allMethodsByGroup.has(spec.group)) allMethodsByGroup.set(spec.group, []);
    const list = allMethodsByGroup.get(spec.group)!;
    for (const m of collected) {
      if (!list.some((existing) => existing.methodName === m.methodName)) list.push(m);
    }
    console.log(`[neuro-ts] ${spec.interface} -> neuro.${spec.group} (+${collected.length})`);
  }

  // Globals
  const globalDecls = findGlobalFunctions(program, new Set(GLOBAL_FUNCTIONS));
  const globalsList: CollectedMethod[] = [];
  for (const [name, decl] of globalDecls) {
    const cm = collectGlobalFunction(program, decl, name);
    if (cm) {
      globalsList.push(cm);
      console.log(`[neuro-ts] global ${name} -> neuro.${name}`);
    }
  }
  if (globalsList.length > 0) allMethodsByGroup.set('globals', globalsList);

  // Load curated prompts and check coverage. Hard-fail in CI mode; warn
  // locally so the developer can iterate.
  const curatedPrompts = await loadPrompts();
  const allMethods: CollectedMethod[] = [];
  for (const list of allMethodsByGroup.values()) allMethods.push(...list);
  const expectedKeys = new Set(
    allMethods.map((m) =>
      m.spec.kind === 'static' && m.group === 'globals'
        ? `neuro.${m.methodName}`
        : `neuro.${m.group}.${m.methodName}`,
    ),
  );
  const missingCurated: string[] = [];
  for (const k of expectedKeys) if (!curatedPrompts.has(k)) missingCurated.push(k);
  const orphanCurated: string[] = [];
  for (const k of curatedPrompts.keys()) if (!expectedKeys.has(k)) orphanCurated.push(k);

  const strict = process.env.NEURO_STRICT_PROMPTS !== '0';
  if (missingCurated.length > 0 || orphanCurated.length > 0) {
    const missingPreview = missingCurated.slice(0, 20).join('\n  ');
    const orphanPreview = orphanCurated.slice(0, 20).join('\n  ');
    const summary =
      `[neuro-ts] curated prompt coverage gap:\n` +
      (missingCurated.length > 0
        ? `  missing (${missingCurated.length}):\n  ${missingPreview}\n`
        : '') +
      (orphanCurated.length > 0 ? `  orphan (${orphanCurated.length}):\n  ${orphanPreview}\n` : '');
    if (strict) {
      console.error(summary);
      throw new Error('curated prompt coverage gap; fix scripts/prompts/<group>.ts');
    } else {
      console.warn(summary);
    }
  }

  // Emit per-group files.
  let totalMethods = 0;
  const groupNames: string[] = [];
  for (const [group, methods] of [...allMethodsByGroup.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (group === 'globals') {
      const { file, content } = emitGlobalsFile(methods);
      writeIfChanged(file, content);
    } else {
      const { file, content } = emitGroupFile(group, methods);
      writeIfChanged(file, content);
    }
    groupNames.push(group);
    totalMethods += methods.length;
  }

  // Index + neuro umbrella + prompts.json
  const groupsIndex = emitGroupsIndex(groupNames);
  writeIfChanged(groupsIndex.file, groupsIndex.content);

  const neuro = emitNeuroNamespace(groupNames);
  writeIfChanged(neuro.file, neuro.content);

  writeIfChanged(PROMPTS_JSON, generatePromptsJson(allMethods, curatedPrompts));

  // Top-level src/generated/index.ts re-exports both the `neuro` umbrella and groups.
  const rootIndex = `// Auto-generated. Do not edit.
export { neuro } from './neuro';
export type { NeuroNamespace } from './neuro';
export * from './groups';
`;
  writeIfChanged(path.join(SRC_GENERATED, 'index.ts'), rootIndex);

  console.log(`[neuro-ts] emitted ${totalMethods} method(s) across ${groupNames.length} group(s)`);
}

main().catch((err) => {
  console.error('[neuro-ts] generation failed:', err);
  process.exit(1);
});
