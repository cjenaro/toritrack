import {
  ActionFunctionArgs,
  useActionData,
  useSearchParams,
  LoaderFunctionArgs,
  Link,
  Form,
  redirect,
} from "react-router";
import { requireAnonymous, sessionKey, signup } from "~/utils/auth.server";
import { z } from "zod";
import { prisma } from "~/utils/db.server";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { authSessionStorage } from "~/utils/session.server";
import { safeRedirect } from "remix-utils/safe-redirect";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { useIsPending } from "~/utils/misc";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAnonymous(request);
  return {};
}

const SignupSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  password: z.string().min(6).max(20),
  confirmPassword: z.string().min(6).max(20),
  remember: z.boolean().optional(),
  redirectTo: z.string().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  await requireAnonymous(request);
  const formData = await request.formData();

  const submission = await parseWithZod(formData, {
    schema: SignupSchema.superRefine(async (data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          path: [""],
          code: z.ZodIssueCode.custom,
          message: "Passwords do not match",
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      });

      if (existingUser) {
        ctx.addIssue({
          path: [""],
          code: z.ZodIssueCode.custom,
          message: "A user already exists with this email",
        });
        return;
      }
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return {
      result: submission.reply(),
      status: submission.status === "error" ? 400 : 200,
    };
  }

  const { email, password, name, remember, redirectTo } = submission.value;

  const session = await signup({
    email,
    password,
    name,
  });
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie"),
  );
  authSession.set(sessionKey, session.id);

  return redirect(safeRedirect(redirectTo), {
    headers: {
      "set-cookie": await authSessionStorage.commitSession(authSession, {
        expires: remember ? session.expirationDate : undefined,
      }),
    },
  });
}

export default function Signup() {
  const actionData = useActionData<typeof action>();
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [form, fields] = useForm({
    id: "onboarding-form",
    constraint: getZodConstraint(SignupSchema),
    defaultValue: { redirectTo },
    //@ts-ignore
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SignupSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <Form method="POST" className="space-y-6" {...getFormProps(form)}>
            <div>
              <label
                htmlFor={fields.email.id}
                className="block text-sm/6 font-medium text-white"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  {...getInputProps(fields.email, { type: "email" })}
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor={fields.password.id}
                  className="block text-sm/6 font-medium text-white"
                >
                  Password
                </label>
              </div>
              <div className="mt-2">
                <input
                  {...getInputProps(fields.password, { type: "password" })}
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor={fields.confirmPassword.id}
                  className="block text-sm/6 font-medium text-white"
                >
                  Confirm Password
                </label>
              </div>
              <div className="mt-2">
                <input
                  {...getInputProps(fields.confirmPassword, {
                    type: "password",
                  })}
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor={fields.name.id}
                  className="block text-sm/6 font-medium text-white"
                >
                  Name
                </label>
              </div>
              <div className="mt-2">
                <input
                  {...getInputProps(fields.name, {
                    type: "text",
                  })}
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center order-2">
                <label
                  htmlFor={fields.remember.id}
                  className="block text-sm/6 font-medium text-white"
                >
                  Remember me
                </label>
              </div>
              <input
                {...getInputProps(fields.remember, {
                  type: "checkbox",
                })}
                className="block border-0 shadow-sm ring-1 ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 "
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center rounded-md bg-indigo-500 disabled:bg-indigo-500/80 disabled:text-white/80 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Sign up
              </button>
            </div>

            {form.errors && form.errors.filter(Boolean).length > 0 ? (
              <ul>
                {form.errors.map((err) => (
                  <li key={err} className="text-sm text-red-500">
                    {err}
                  </li>
                ))}
              </ul>
            ) : null}
          </Form>

          <p className="mt-10 text-center text-sm/6 text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-400 hover:text-indigo-300"
            >
              LogIn
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
