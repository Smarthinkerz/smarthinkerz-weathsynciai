declare global {
  interface DirectAuthToken {
    companyId: number;
    expires: number;
  }

  var directAuthTokens: Map<string, DirectAuthToken>;

  namespace NodeJS {
    interface Global {
      directAuthTokens: Map<string, DirectAuthToken>;
    }
  }
}

export {}