type OsEntry = {
  id: number;
  name: string;
  version: string | null;
  family: string;
};

const OS_ENTRIES: OsEntry[] = [
  { id: 1, name: "Windows 11", version: "11", family: "Windows" },
  { id: 2, name: "Windows 10", version: "10", family: "Windows" },
  { id: 3, name: "macOS Sonoma", version: "14", family: "macOS" },
  { id: 4, name: "macOS Ventura", version: "13", family: "macOS" },
  { id: 5, name: "Ubuntu", version: "22.04", family: "Linux" },
  { id: 6, name: "Ubuntu", version: "24.04", family: "Linux" },
  { id: 7, name: "Android", version: "14", family: "Android" },
  { id: 8, name: "Android", version: "13", family: "Android" },
  { id: 9, name: "iOS", version: "17", family: "iOS" },
  { id: 10, name: "iOS", version: "16", family: "iOS" },
  { id: 11, name: "Outro", version: null, family: "Other" },
];

const OTHER_OS_ID = 11;

type ClientDeviceInfo = {
  os_id: number;
  browser: string;
};

type UAData = {
  platform?: string;
  platformVersion?: string;
  brands?: Array<{ brand: string; version: string }>;
};

function getBrowserFromUAData(uaData?: UAData): string | null {
  if (!uaData?.brands || uaData.brands.length === 0) return null;

  const ignoredBrands = new Set(["Chromium", "Not(A:Brand", "Not A(Brand"]);

  const preferred =
    uaData.brands.find(
      (b) => b.brand && !ignoredBrands.has(b.brand)
    ) ?? uaData.brands[0];

  if (!preferred?.brand) return null;
  return `${preferred.brand} ${preferred.version}`.trim();
}

function getBrowserFromUA(userAgent: string): string {
  const ua = userAgent;

  const edge = ua.match(/Edg\/([\d.]+)/);
  if (edge) return `Edge ${edge[1]}`;

  const opera = ua.match(/OPR\/([\d.]+)/);
  if (opera) return `Opera ${opera[1]}`;

  const chrome = ua.match(/Chrome\/([\d.]+)/);
  if (chrome) return `Chrome ${chrome[1]}`;

  const firefox = ua.match(/Firefox\/([\d.]+)/);
  if (firefox) return `Firefox ${firefox[1]}`;

  const safari = ua.match(/Version\/([\d.]+).*Safari/);
  if (safari) return `Safari ${safari[1]}`;

  return "Unknown";
}

function resolveOsId(family: string, version: string | null): number {
  const match = OS_ENTRIES.find(
    (entry) => entry.family === family && entry.version === version
  );
  return match?.id ?? OTHER_OS_ID;
}

function detectOsFromUserAgent(userAgent: string): { family: string; version: string | null } {
  const ua = userAgent;

  if (/Windows NT 10\.0/.test(ua)) {
    // Windows 10/11 share NT 10.0; default to 10 when version is unknown.
    return { family: "Windows", version: "10" };
  }

  const mac = ua.match(/Mac OS X (\d+)[._]/);
  if (mac) {
    const major = mac[1];
    if (major === "14") return { family: "macOS", version: "14" };
    if (major === "13") return { family: "macOS", version: "13" };
    return { family: "macOS", version: null };
  }

  const ios = ua.match(/OS (\d+)[._]\d+ like Mac OS X/);
  if (ios) {
    const major = ios[1];
    if (major === "17") return { family: "iOS", version: "17" };
    if (major === "16") return { family: "iOS", version: "16" };
    return { family: "iOS", version: null };
  }

  const android = ua.match(/Android (\d+)/);
  if (android) {
    const major = android[1];
    if (major === "14") return { family: "Android", version: "14" };
    if (major === "13") return { family: "Android", version: "13" };
    return { family: "Android", version: null };
  }

  if (/Ubuntu/.test(ua)) {
    if (/Ubuntu 24\.04/.test(ua)) return { family: "Linux", version: "24.04" };
    if (/Ubuntu 22\.04/.test(ua)) return { family: "Linux", version: "22.04" };
    return { family: "Linux", version: null };
  }

  return { family: "Other", version: null };
}

async function getUAData(): Promise<UAData | undefined> {
  if (typeof navigator === "undefined") return undefined;

  const uaData = (navigator as Navigator & { userAgentData?: any }).userAgentData;
  if (!uaData) return undefined;

  if (typeof uaData.getHighEntropyValues !== "function") {
    return {
      platform: uaData.platform,
      brands: uaData.brands,
    };
  }

  const values = await uaData.getHighEntropyValues(["platformVersion"]);
  return {
    platform: uaData.platform,
    platformVersion: values.platformVersion,
    brands: uaData.brands,
  };
}

function resolveWindowsVersionFromPlatformVersion(platformVersion?: string): string | null {
  if (!platformVersion) return null;
  const major = Number.parseInt(platformVersion.split(".")[0] ?? "", 10);
  if (Number.isNaN(major)) return null;
  // Windows 11 reports 13+ (approx). If unknown, fallback to 10.
  return major >= 13 ? "11" : "10";
}

export async function getClientDeviceInfo(): Promise<ClientDeviceInfo> {
  if (typeof navigator === "undefined") {
    return { os_id: OTHER_OS_ID, browser: "Unknown" };
  }

  const userAgent = navigator.userAgent || "";
  const uaData = await getUAData();

  const browser =
    getBrowserFromUAData(uaData) ?? getBrowserFromUA(userAgent);

  if (uaData?.platform === "Windows") {
    const windowsVersion = resolveWindowsVersionFromPlatformVersion(
      uaData.platformVersion
    );
    return {
      os_id: resolveOsId("Windows", windowsVersion ?? "10"),
      browser,
    };
  }

  const { family, version } = detectOsFromUserAgent(userAgent);
  return {
    os_id: resolveOsId(family, version),
    browser,
  };
}
