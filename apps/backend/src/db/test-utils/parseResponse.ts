export const parseResponse = <T>(response: { body: string }): T => {
  return JSON.parse(response.body) as T;
};
