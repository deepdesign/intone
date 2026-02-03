import { ForbiddenWords } from "./forbidden-words";

interface ForbiddenWordsServerProps {
  brandId: string;
}

export function ForbiddenWordsServer({ brandId: _brandId }: ForbiddenWordsServerProps) {
  // Server component wrapper - the actual component is client-side
  return <ForbiddenWords />;
}



