"use client";

const DEFAULT_LOCAL_API_URL = "http://localhost:3333";
const AZURE_WEB_SUFFIX = "-web.azurewebsites.net";
const AZURE_API_SUFFIX = "-api.azurewebsites.net";

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function getAzureApiUrl(hostname: string, protocol: string) {
  if (!hostname.endsWith(AZURE_WEB_SUFFIX)) {
    return null;
  }

  return `${protocol}//${hostname.slice(0, -AZURE_WEB_SUFFIX.length)}${AZURE_API_SUFFIX}`;
}

function getCustomDomainApiUrl(hostname: string, protocol: string) {
  if (hostname === "lexnexus.tech" || hostname === "www.lexnexus.tech") {
    return `${protocol}//api.lexnexus.tech`;
  }

  if (hostname.startsWith("www.")) {
    return `${protocol}//api.${hostname.slice(4)}`;
  }

  return null;
}

export function getApiUrl() {
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envApiUrl) {
    return trimTrailingSlash(envApiUrl);
  }

  if (typeof window === "undefined") {
    return DEFAULT_LOCAL_API_URL;
  }

  const { hostname, protocol } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return DEFAULT_LOCAL_API_URL;
  }

  return trimTrailingSlash(
    getCustomDomainApiUrl(hostname, protocol) ??
      getAzureApiUrl(hostname, protocol) ??
      DEFAULT_LOCAL_API_URL
  );
}
