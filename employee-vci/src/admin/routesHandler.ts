import Koa from "koa";

import { Result } from "../../../common/src/types";
import {
  handleNotSuccessResult,
  NotSuccessResult,
} from "../../../common/src/routerCommon.js";
import {
  generateRandomNumericString,
  generateRandomString,
} from "../../../common/src/utils/randomStringUtils.js";
import { credentialOffer2Url } from "../../../common/src/oid4vci/CredentialOffer.js";

import store, { NewEmployee } from "../store.js";

export async function handleNewEmployee(ctx: Koa.Context) {
  if (!ctx.request.body) {
    ctx.body = { status: "error", message: "Invalid data received!" };
    ctx.status = 400;
    return;
  }
  const employee = ctx.request.body.employee;

  const result = await registerEmployee(employee);
  if (result.ok) {
    ctx.body = result.payload;
    ctx.status = 201;
  } else {
    handleNotSuccessResult(result.error, ctx);
  }
}

export async function handleEmployeeCredentialOffer(ctx: Koa.Context) {
  const { employeeNo } = ctx.params;
  const result = await generateCredentialOffer(employeeNo);
  if (result.ok) {
    ctx.body = result.payload;
    ctx.status = 201;
  } else {
    handleNotSuccessResult(result.error, ctx);
  }
}

const registerEmployee = async (
  payload: any,
): Promise<Result<NewEmployee, NotSuccessResult>> => {
  try {
    if (typeof payload !== "object" || !payload) {
      return { ok: false, error: { type: "INVALID_PARAMETER" } };
    }

    const { companyName, employeeNo, division, givenName, familyName, gender } = payload;

    if (
      typeof companyName !== "string" ||
      typeof employeeNo !== "string" ||
      typeof division !== "string" ||
      typeof givenName !== "string" ||
      typeof familyName !== "string" ||
      typeof gender !== "string"
    ) {
      return { ok: false, error: { type: "INVALID_PARAMETER" } };
    }

    const newEmployee: NewEmployee = {
      companyName,
      employeeNo,
      division,
      givenName,
      familyName,
      gender,
    };

    // Execute store.registerEmployee
    await store.registerEmployee(newEmployee);

    return { ok: true, payload: newEmployee };
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      return {
        ok: false,
        error: { type: "INTERNAL_ERROR", message: e.message },
      };
    } else {
      return { ok: false, error: { type: "INTERNAL_ERROR", message: "" } };
    }
  }
};

export type GenerateCredentialOfferResult = {
  subject: any;
  credentialOffer: string;
  userPin: string;
};
const generateCredentialOffer = async (
  employeeNo: string,
): Promise<Result<GenerateCredentialOfferResult, NotSuccessResult>> => {
  // get employee
  const employee = await store.getEmployeeByNo(employeeNo);
  if (!employee) {
    return { ok: false, error: { type: "NOT_FOUND" } };
  }

  // generate pre-auth code
  const code = generateRandomString();
  const expiresIn = Number(process.env.VCI_PRE_AUTH_CODE_EXPIRES_IN || "86400");
  const userPin = generateRandomNumericString();
  await store.addPreAuthCode(code, expiresIn, userPin, employee.id);

  // generate credential offer
  const credentialOffer = {
    credential_issuer: process.env.CREDENTIAL_ISSUER || "",
    credentials: ["EmployeeIdentificationCredential"],
    grants: {
      "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
        "pre-authorized_code": code,
        user_pin_required: true,
      },
    },
  };
  const credentialOfferUrl = credentialOffer2Url(credentialOffer);
  const payload = {
    subject: { employeeNo },
    credentialOffer: credentialOfferUrl,
    userPin,
  };
  return { ok: true, payload };
};

export default {
  handleNewEmployee,
  handleEmployeeCredentialOffer,
};