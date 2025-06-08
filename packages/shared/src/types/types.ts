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
