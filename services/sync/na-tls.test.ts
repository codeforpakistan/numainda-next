import tls from "node:tls"

import { gogetSslIntermediate, naCaBundle } from "./na-tls"

describe("GoGetSSL intermediate", () => {
  const cert = gogetSslIntermediate()

  it("is the pinned GoGetSSL CA signed by the Sectigo root", () => {
    expect(cert.subject).toContain("CN=GoGetSSL RSA DV SSL CA 2")
    expect(cert.issuer).toContain(
      "CN=Sectigo Public Server Authentication Root R46"
    )
    expect(cert.fingerprint256).toBe(
      "B5:28:67:96:DA:DF:16:52:1D:E4:17:72:AB:2F:DB:58:18:72:99:71:B5:27:47:21:14:6C:6E:81:72:BE:FE:07"
    )
  })

  it("adds that intermediate beside the system roots", () => {
    const bundle = naCaBundle()
    expect(bundle.length).toBe(tls.rootCertificates.length + 1)
    expect(bundle.at(-1)).toContain("BEGIN CERTIFICATE")
    expect(bundle.slice(0, -1)).toEqual(tls.rootCertificates)
  })
})
