import { CredentialOffer, TxCode } from "./types/types.js";

export const credentialOffer2Url = (
  credentialOffer: CredentialOffer,
  endpoint?: string,
) => {
  const serializedCredentialOffer = JSON.stringify(credentialOffer);
  const encodedCredentialOffer = encodeURIComponent(serializedCredentialOffer);
  return `${
    endpoint ? endpoint : "openid-credential-offer://"
  }?credential_offer=${encodedCredentialOffer}`;
};
export const url2CredentialOffer = (credentialOfferUrl: string) => {
  const urlParams = new URLSearchParams(new URL(credentialOfferUrl).search);
  const encodedCredentialOffer = urlParams.get("credential_offer");

  if (!encodedCredentialOffer) {
    throw new Error("credential_offer parameter is missing in the URL.");
  }

  const decodedCredentialOffer = decodeURIComponent(encodedCredentialOffer);

  // todo: should validate the data structure.
  return JSON.parse(decodedCredentialOffer) as CredentialOffer;
};

export const generatePreAuthCredentialOffer = (
  credentialIssuer: string,
  credentials: string[],
  preAuthCode: string,
  txCode?: TxCode,
  endpoint?: string,
): string => {
  const credentialOffer: CredentialOffer = {
    credential_issuer: credentialIssuer || "",
    credential_configuration_ids: credentials,
    grants: {
      "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
        "pre-authorized_code": preAuthCode,
        ...(txCode !== undefined && { tx_code: txCode }),
      },
    },
  };
  return credentialOffer2Url(credentialOffer, endpoint);
};
