import fetch from "node-fetch";
import fs, { write } from "fs";
import env from "./env.js";
import { create } from "domain";

let store = {
  authToken: null,
  refreshToken: null,
  claims: null,
};

const resetTokens = async function () {
  authToken;
};

const login = async function (account, username, password) {
    console.log('logging in..')
  const result = await fetch(`${env.URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account,
      username,
      password,
    }),
  });
  const response =  await result.json();
  console.log('Logged in.');
  return response; 
};

const writeToStore = function (result) {
  let claimsString = Buffer.from(
    result.authToken.split(".")[1],
    "base64"
  ).toString();
  store.claims = JSON.parse(claimsString);
  fs.writeFileSync(".refreshToken", result.refreshToken, {
    encoding: "utf-8",
  });
  fs.writeFileSync(".authToken", result.authToken, { encoding: "utf-8" });
  store.authToken = result.authToken;
  store.refreshToken = result.refreshToken;
};

const refresh = async function () {
  console.log("refresh tokens");
  let duetime = store.claims.exp - Date.now() - 60;
  if (duetime < 0) duetime = 0;

  console.log("token due in", duetime, "seconds, setting up timeout");

  setTimeout(async () => {
    try {
      const response = await fetch(`${env.URL}/login/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${store.authToken}`,
        },
        body: JSON.stringify({ refreshToken: store.refreshToken }),
      });
      console.log("status", response.status, response.statusText, response);
      const result = await response.json();
      writeToStore(result);
    } catch (err) {
        console.error(err);
        await createTokens();
    }
    refresh();
  }, duetime*60);
};

const createTokens = async function () {
  let result = await login(env.ACCOUNT, env.USERNAME, env.PASSWORD);
  writeToStore(result);
};

const maintainTokens = async function () {
  //read last state from disk
  if (!store.refreshToken && fs.existsSync(".refreshToken")) {
    console.log('found refreshtoken, load it...')
    store.refreshToken = fs.readFileSync(".refreshToken", {
      encoding: "utf-8",
    });
  }

  //read authToken from disk
  if (!store.authToken && fs.existsSync(".authToken")) {
    console.log('found authToken, load it...')
    store.authToken = fs.readFileSync(".authToken", { encoding: "utf-8" });
    let claimsString = Buffer.from(
      store.authToken.split(".")[1],
      "base64"
    ).toString();

    store.claims = JSON.parse(claimsString);
        console.log('loaded claims', store.claims)
  }

  //if process has no claims, consider this a new login.
  if (!store.claims) {
    console.log('no claims found, create new tokens...')
    await createTokens();
  }

  //setup refreshtimeout callback
  refresh();
};

export { store, resetTokens, maintainTokens };
