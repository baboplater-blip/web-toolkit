// JSON 값을 재귀적으로 TypeScript interface 선언으로 변환한다.
// 의존성 없이 동작하며 브라우저/노드 양쪽에서 순수 함수로 사용한다.

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** 객체 키가 TS 식별자로 그대로 쓸 수 있는지 검사한다. */
function formatKey(key: string): string {
  return VALID_IDENTIFIER.test(key) ? key : JSON.stringify(key);
}

/** 루트 이름을 안전한 PascalCase 식별자로 정규화한다. */
function sanitizeRootName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9_$]/g, ' ');
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const pascal = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  if (!pascal || /^[0-9]/.test(pascal)) {
    return `Root${pascal}`;
  }
  return pascal;
}

/** 단수형 이름 추정: 끝의 s/ies 를 제거해 배열 요소 인터페이스명을 만든다. */
function singularize(name: string): string {
  if (/ies$/i.test(name)) return `${name.slice(0, -3)}y`;
  if (/sses$/i.test(name)) return name.slice(0, -2);
  if (/s$/i.test(name) && !/ss$/i.test(name)) return name.slice(0, -1);
  return name;
}

interface InterfaceCollector {
  /** 생성된 인터페이스 본문을 선언 순서대로 저장 */
  declarations: string[];
  /** 이미 사용한 인터페이스 이름(중복 방지) */
  usedNames: Set<string>;
}

/** 중복되지 않는 인터페이스 이름을 확보한다. */
function reserveName(name: string, collector: InterfaceCollector): string {
  const base = name || 'Item';
  let candidate = base;
  let suffix = 2;
  while (collector.usedNames.has(candidate)) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  collector.usedNames.add(candidate);
  return candidate;
}

/**
 * 단일 JSON 값의 타입 문자열을 추론한다.
 * 객체는 중첩 인터페이스를 collector 에 추가하고 그 이름을 반환한다.
 */
function inferType(
  value: JsonValue,
  suggestedName: string,
  collector: InterfaceCollector,
): string {
  if (value === null) return 'null';

  if (Array.isArray(value)) {
    return inferArrayType(value, suggestedName, collector);
  }

  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      return inferObjectType(value, suggestedName, collector);
    default:
      // function/undefined/symbol 은 유효한 JSON.parse 결과에 등장하지 않는다.
      return 'unknown';
  }
}

/** 배열 요소 타입들의 유니온을 만든다. 빈 배열은 unknown[]. */
function inferArrayType(
  values: JsonValue[],
  suggestedName: string,
  collector: InterfaceCollector,
): string {
  if (values.length === 0) return 'unknown[]';

  const elementName = singularize(suggestedName);
  const memberTypes = new Set<string>();
  for (const item of values) {
    memberTypes.add(inferType(item, elementName, collector));
  }

  const members = [...memberTypes];
  if (members.length === 1) {
    return `${members[0]}[]`;
  }
  return `(${members.join(' | ')})[]`;
}

/** 객체를 중첩 인터페이스로 등록하고 이름을 반환한다. */
function inferObjectType(
  value: { [key: string]: JsonValue },
  suggestedName: string,
  collector: InterfaceCollector,
): string {
  const interfaceName = reserveName(suggestedName, collector);
  const entries = Object.entries(value);

  const lines = entries.map(([key, child]) => {
    const childName = `${interfaceName}${capitalize(key)}`;
    const childType = inferType(child, childName, collector);
    return `  ${formatKey(key)}: ${childType};`;
  });

  const body =
    lines.length > 0
      ? `interface ${interfaceName} {\n${lines.join('\n')}\n}`
      : `interface ${interfaceName} {\n  [key: string]: unknown;\n}`;

  collector.declarations.push(body);
  return interfaceName;
}

function capitalize(text: string): string {
  const safe = text.replace(/[^A-Za-z0-9_$]/g, '');
  if (!safe) return 'Field';
  return safe.charAt(0).toUpperCase() + safe.slice(1);
}

export interface ConvertResult {
  code: string;
}

/**
 * JSON 문자열을 TypeScript interface 선언으로 변환한다.
 * 파싱 실패 시 예외를 던지므로 호출 측에서 처리한다.
 */
export function jsonToTypeScript(jsonText: string, rootName: string): ConvertResult {
  const parsed = JSON.parse(jsonText) as JsonValue;
  const safeRoot = sanitizeRootName(rootName);

  const collector: InterfaceCollector = {
    declarations: [],
    usedNames: new Set<string>(),
  };

  if (Array.isArray(parsed)) {
    // 루트가 배열이면 요소 인터페이스 + 별칭 타입을 생성한다.
    const elementType = inferArrayType(parsed, safeRoot, collector);
    const alias = `type ${safeRoot} = ${elementType};`;
    const code = [...collector.declarations, alias].join('\n\n');
    return { code: `${code}\n` };
  }

  if (parsed !== null && typeof parsed === 'object') {
    inferObjectType(parsed, safeRoot, collector);
    return { code: `${collector.declarations.join('\n\n')}\n` };
  }

  // 루트가 원시값이면 별칭 타입으로 표현한다.
  const primitiveType = inferType(parsed, safeRoot, collector);
  return { code: `type ${safeRoot} = ${primitiveType};\n` };
}
