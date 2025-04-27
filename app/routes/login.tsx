import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useNavigation } from "@remix-run/react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { authenticator } from "~/services/auth.server";

// Simples loader para manter a estrutura da rota
export async function loader() {
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Autentica o usuário com o GitHub
    const user = await authenticator.authenticate("github", request);
    if (!user) {
      return json({ error: "Falha na autenticação" }, { status: 401 });
    }
  } catch (error) {
    console.error("Erro ao autenticar:", error);
    return json({ error: "Erro ao autenticar" }, { status: 500 });
  }
}

export default function Login() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-green-50 to-green-100 items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo.svg"
            alt="LeetCash Logo"
            className="h-20 w-20 mx-auto"
          />
          <h1 className="mt-2 text-3xl font-bold text-green-800">LeetCash</h1>
          <p className="mt-2 text-gray-600">
            Torne-se um programador melhor, ganhando enquanto aprende.
          </p>
        </div>

        <Card className="w-full bg-white shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-bold text-gray-800">
              Entre na sua conta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center text-sm text-gray-600 mt-2 mb-6">
              Acesse sua conta para ver seu progresso e ganhar recompensas por
              sua consistência em programação
            </div>
            <Form method="post" action="/auth/github">
              <Button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg shadow transition-all hover:shadow-lg flex items-center justify-center gap-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Entrando..."
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    Entrar com GitHub
                  </>
                )}
              </Button>
            </Form>
          </CardContent>
          <CardFooter className="border-t pt-5 text-center">
            <p className="text-xs text-gray-500">
              Ao entrar, você concorda com nossos termos e condições.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
