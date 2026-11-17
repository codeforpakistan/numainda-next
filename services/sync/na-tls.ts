import { X509Certificate } from "node:crypto"
import { readFileSync } from "node:fs"
import https from "node:https"
import path from "node:path"
import tls from "node:tls"

/**
 * na.gov.pk's leaf is issued by GoGetSSL RSA DV SSL CA 2, and the server
 * does not send that intermediate. The intermediate is signed by Sectigo
 * Public Server Authentication Root R46, which is already in the system
 * trust store. Verification stays on. This file is a public CA certificate.
 */
const INTERMEDIATE_PATH = path.join(
  __dirname,
  "certs",
  "gogetssl-rsa-dv-ssl-ca-2.pem"
)

export const GOGETSSL_CA2_FINGERPRINT256 =
  "B5:28:67:96:DA:DF:16:52:1D:E4:17:72:AB:2F:DB:58:18:72:99:71:B5:27:47:21:14:6C:6E:81:72:BE:FE:07"

export function gogetSslIntermediate(): X509Certificate {
  const cert = new X509Certificate(readFileSync(INTERMEDIATE_PATH))
  if (cert.fingerprint256 !== GOGETSSL_CA2_FINGERPRINT256) {
    throw new Error(
      "GoGetSSL intermediate fingerprint does not match the pinned value"
    )
  }
  if (!cert.subject.includes("GoGetSSL RSA DV SSL CA 2")) {
    throw new Error("GoGetSSL intermediate subject is not the expected CA")
  }
  return cert
}

/** System roots plus the one missing intermediate. Replaces nothing. */
export function naCaBundle(): string[] {
  return [...tls.rootCertificates, gogetSslIntermediate().toString()]
}

export function fetchText(url: string, redirectsLeft = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: { "user-agent": "numainda-sync" },
        ca: naCaBundle(),
        rejectUnauthorized: true,
      },
      (response) => {
        const status = response.statusCode ?? 0
        const location = response.headers.location
        if (status >= 300 && status < 400 && location) {
          response.resume()
          if (redirectsLeft <= 0) {
            reject(new Error(`Too many redirects from ${url}`))
            return
          }
          const next = new URL(location, url)
          if (next.protocol !== "https:") {
            reject(new Error(`Refusing a non-HTTPS redirect to ${next.origin}`))
            return
          }
          resolve(fetchText(next.toString(), redirectsLeft - 1))
          return
        }

        const chunks: Buffer[] = []
        response.on("data", (chunk: Buffer) => chunks.push(chunk))
        response.on("end", () => {
          const type = String(response.headers["content-type"] ?? "")
          if (type.includes("application/pdf")) {
            reject(
              new Error(
                `GET ${url} returned a PDF. This command reads listing HTML only.`
              )
            )
            return
          }
          if (status < 200 || status >= 300) {
            reject(new Error(`GET ${url} returned ${status}`))
            return
          }
          resolve(Buffer.concat(chunks).toString("utf8"))
        })
      }
    )
    request.on("error", reject)
  })
}
