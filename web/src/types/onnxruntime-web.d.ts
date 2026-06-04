/**
 * onnxruntime-web 의 package.json "exports" 가 타입 경로를 노출하지 않아
 * TS 가 선언을 찾지 못한다. 이 모듈은 동적 import 로만 쓰고 자체 최소 인터페이스
 * (lib/tools/yunet.ts)로 타입을 좁히므로, 여기서는 any 모듈로 선언만 한다.
 */
declare module 'onnxruntime-web';
