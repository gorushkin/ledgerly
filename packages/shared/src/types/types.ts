export type ErrorResponse = {
  error: string;
  message: string;
};

export type ValidationError = {
  error: true;
  errors: [
    {
      code: string;
      field: string;
      message: string;
    },
  ];
};

export type IsoDatetimeString = string;
// export type IsoDatetimeString = string & { readonly __brand: "ISO-8601" };

export type CurrencyCode = string;
// export type CurrencyCode = string & { readonly __brand: "CurrencyCode" };

// export type IsoDatetimeString = z.infer<typeof isoDatetime>;
