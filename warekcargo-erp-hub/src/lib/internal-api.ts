export function getInternalAutomationSecret() {
  return process.env.INTERNAL_AUTOMATION_SECRET || null;
}

export function readInternalApiKey(request: Request) {
  return request.headers.get('x-internal-api-key');
}

export function isAuthorizedInternalRequest(request: Request) {
  const expectedSecret = getInternalAutomationSecret();
  const providedSecret = readInternalApiKey(request);

  return Boolean(expectedSecret && providedSecret && expectedSecret === providedSecret);
}
