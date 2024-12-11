import {
  type RouteConfig,
  index,
  route,
  prefix,
} from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("up", "routes/up.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("signup", "routes/signup.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  ...prefix("clients", [
    index("routes/client/home.tsx"),
    route("new", "routes/client/new.tsx"),
    route(":clientId", "routes/client/client.tsx"),
    route(":clientId/edit", "routes/client/edit.tsx"),
  ]),
] satisfies RouteConfig;
