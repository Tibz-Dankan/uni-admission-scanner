let API_BASE_URL: string;

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  API_BASE_URL = "http://localhost:8081/api/v1";
} else {
  API_BASE_URL = "https://unidocscanner.judiciaryhrm.com/api/v1";
}

export { API_BASE_URL };
