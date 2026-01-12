declare module 'languagetool-api' {
  interface LanguageToolOptions {
    endpoint?: string;
  }

  interface Match {
    message: string;
    shortMessage: string;
    offset: number;
    length: number;
    replacements: { value: string }[];
    rule: {
      id: string;
      subId: string;
      description: string;
      issueType: string;
      category: {
        id: string;
        name: string;
      };
    };
  }

  interface LanguageToolResponse {
    software: {
      name: string;
      version: string;
      buildDate: string;
      apiVersion: number;
      status: string;
    };
    warnings: {
      incompleteResults: boolean;
    };
    language: {
      name: string;
      code: string;
      detectedLanguage: {
        name: string;
        code: string;
        confidence: number;
      };
    };
    matches: Match[];
  }

  class LanguageToolApi {
    constructor(options: LanguageToolOptions);
    check(text: string, language: string): Promise<LanguageToolResponse>;
  }

  export default LanguageToolApi;
}