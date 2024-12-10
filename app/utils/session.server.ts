import { createCookieSessionStorage } from "react-router";

if (!process.env.SESSION_SECRET) {
  throw new Error("Session secret needs to be set on env variables");
}

export const authSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "as_session",
    sameSite: "lax", // CSRF protection is advised if changing to 'none'
    path: "/",
    httpOnly: true,
    secrets: process.env.SESSION_SECRET.split(","),
    secure: process.env.NODE_ENV === "production",
  },
});
