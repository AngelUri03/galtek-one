export class APIfetchApi {
  async fetchApi(headers = {}, method, body, url, options = {}) {
    const methodName = (method || "GET").toUpperCase();
    const logoutOnUnauthorized = options?.logoutOnUnauthorized !== false;
    const raw = sessionStorage.getItem("auth_session");

    let session = null;
    try {
      session = raw ? JSON.parse(raw) : null;
    } catch {
      session = null;
    }

    const token = session?.token;
    const usuario = session?.usuario;
    const idEmpresa = session?.idEmpresa;

    const finalHeaders = {
      "Content-Type": "application/json",
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(usuario ? { user: usuario } : {}),
      ...(idEmpresa !== undefined && idEmpresa !== null
        ? { idEmpresa: String(idEmpresa) }
        : {}),
    };

    const request = {
      method: methodName,
      headers: finalHeaders,
      body:
        body && methodName !== "GET" && methodName !== "HEAD"
          ? JSON.stringify(body)
          : undefined,
    };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        if (token && typeof window !== "undefined") {
          window.dispatchEvent(new Event("galtekone:activity"));
        }

        const response = await fetch(url, request);
        if (!(await this.shouldRetryResponse(response, methodName, url)) || attempt === 3) {
          if (
            logoutOnUnauthorized &&
            token &&
            response.status === 401 &&
            typeof window !== "undefined"
          ) {
            window.dispatchEvent(new Event("galtekone:unauthorized"));
          }
          return response;
        }
      } catch (error) {
        console.log(error);
        if (attempt === 3) return undefined;
      }

      await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
    }

    return undefined;
  }

  async shouldRetryResponse(response, method, url) {
    const readOnlyRequest =
      ["GET", "HEAD", "OPTIONS"].includes(method) ||
      (method === "POST" && String(url || "").includes("/filtrar"));

    if (!readOnlyRequest) return false;

    const transientStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);
    if (transientStatuses.has(response.status)) return true;

    if (response.status !== 401) return false;

    try {
      const payload = await response.clone().json();
      const message = String(payload?.message || "").toLowerCase();
      return message.includes("sqlite_busy") || message.includes("database is locked");
    } catch {
      return false;
    }
  }
}
