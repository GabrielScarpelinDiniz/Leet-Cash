import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { sessionStorage } from "../services/auth.server";
import { getCurrentCompetition } from "~/services/competition.server";
import { getUserById, getUsersRank } from "~/services/user.server";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const session = await sessionStorage.getSession(
      request.headers.get("cookie")
    );
    const user = session.get("user");

    if (!user) {
      return redirect("/login");
    }

    const userBd = await getUserById(user.id);

    if (!userBd) {
      return redirect("/login");
    }

    const currentCompetition = await getCurrentCompetition();

    if (!currentCompetition) {
      return null;
    }
    // Round both values to ensure consistent integers
    const daysLeft = Math.floor(
      (new Date(currentCompetition.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const totalDays = Math.floor(
      (new Date(currentCompetition.endDate).getTime() -
        new Date(currentCompetition.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Calculate days elapsed correctly
    const daysElapsed = totalDays - daysLeft;

    // Ranking completo simulado
    const fullRanking = await getUsersRank(undefined);

    return json({
      user: fullRanking.find((userData) => userData.id === user.id),
      currentCompetition,
      daysLeft,
      totalDays,
      fullRanking,
      daysElapsed,
    });
  } catch (error) {
    console.error("Error in loader:", error);
    return redirect("/login");
  }
};

type LoaderData = {
  user: {
    id: string;
    name: string;
    challengesCompleted: number;
    streaks: number;
  };
  daysLeft: number;
  totalDays: number;
  fullRanking: {
    id: string;
    name: string;
    challengesCompleted: number;
    streaks: number;
    avatar: string;
  }[];
  currentCompetition: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    repo: string;
    owner: string;
  };
  daysElapsed: number;
};

// Em uma aplicação real você usaria useLoaderData() para obter os dados
// Para simplicidade, estamos usando dados do exemplo
export default function Dashboard() {
  const data = useLoaderData<LoaderData | null>();

  const handleCheckin = async () => {
    const response = await fetch("/api/checkin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: data?.user.id,
        competitionId: data?.currentCompetition.id,
        repo: data?.currentCompetition.repo,
        owner: data?.currentCompetition.owner,
      }),
    });
    if (response.ok) {
      alert("Check-in realizado com sucesso!");
    }
    if (response.status === 401) {
      alert(
        "Você não está autorizado a fazer check-in. \nServer Response: " +
          (await response.text())
      );
    }
    if (response.status === 404) {
      alert(
        "Usuário não encontrado. \nServer Response: " + (await response.text())
      );
    }
    if (response.status === 500) {
      alert(
        "Erro ao realizar check-in. \nServer Response: " +
          (await response.text())
      );
    }
    if (response.status === 400) {
      alert(
        "Você já fez check-in hoje. Ou você não teve commits hoje. \nServer Response: " +
          (await response.text())
      );
    }
    if (response.status === 403) {
      alert("Você não pode fazer check-in hoje.");
    }
  };

  if (data === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="p-6">
          <h2 className="text-xl font-bold">Nenhum evento em andamento</h2>
          <p className="text-gray-600">Não há competições ativas no momento.</p>
        </Card>
      </div>
    );
  }

  const { user, daysLeft, totalDays, fullRanking, daysElapsed } = data;

  const position =
    fullRanking.findIndex((userRank) => user.id === userRank.id) + 1;

  const progress = ((totalDays - daysLeft) / totalDays) * 100;
  const today = new Date();
  const dateOptions = {
    day: "numeric" as const,
    month: "long" as const,
    year: "numeric" as const,
  };
  const formattedDate = today.toLocaleDateString("pt-BR", dateOptions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="LeetCash Logo" className="h-10 w-10" />
            <span className="text-2xl font-bold text-green-700">LeetCash</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500">{formattedDate}</span>
            <Avatar className="h-10 w-10 ring-2 ring-green-500">
              <AvatarImage
                src={`https://github.com/${user.name
                  .split(" ")[0]
                  .toLowerCase()}.png`}
              />
              <AvatarFallback className="bg-green-700 text-white">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <section className="mb-8">
          <Card className="bg-white overflow-hidden shadow-lg border-0">
            <div className="flex flex-col md:flex-row">
              <div className="p-8 md:w-2/3">
                <h1 className="text-2xl md:text-3xl font-bold text-green-800 mb-2">
                  Olá, {user.name}!
                </h1>
                <p className="text-gray-600 mb-6">
                  Você está em {position}º lugar no ranking geral com{" "}
                  {user.challengesCompleted} pontos.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 shadow-md">
                    <p className="text-sm opacity-80">Streak atual</p>
                    <p className="text-3xl font-bold">🔥 {user.streaks} dias</p>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 shadow-md">
                    <p className="text-sm opacity-80">Desafios completados</p>
                    <p className="text-3xl font-bold">
                      {user.challengesCompleted}
                    </p>
                  </Card>
                </div>

                <Button
                  onClick={handleCheckin}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg shadow-md transition-all hover:shadow-lg"
                >
                  Fazer Check-in de Hoje
                </Button>
              </div>

              <div className="bg-green-700 p-8 md:w-1/3 flex flex-col justify-center">
                <div className="text-center">
                  <h3 className="text-white text-2xl font-bold mb-3">
                    Constância
                  </h3>
                  <div className="w-36 h-36 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-4">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-white">
                        {user.streaks}
                      </div>
                      <div className="text-white text-sm">
                        dias consecutivos
                      </div>
                    </div>
                  </div>
                  <p className="text-green-100 mb-4">
                    Mantenha sua constância para subir no ranking!
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-white text-white hover:bg-green-600 bg-green-800"
                    onClick={handleCheckin}
                  >
                    Check-in
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Progress Section */}
          <section className="md:col-span-1">
            <Card className="bg-white shadow-lg border-0 overflow-hidden">
              <CardHeader className="bg-green-50 border-b border-green-100">
                <CardTitle className="text-xl font-bold text-green-800">
                  Seu Progresso
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">
                      Progresso da temporada
                    </span>
                    <span className="text-green-600 font-semibold">
                      {daysElapsed}/{totalDays} dias
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Faltam {daysLeft} dias para o final da temporada
                  </p>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Meta diária
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Faça um commit diário para manter sua constância e
                      acumular pontos.
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-600">Hoje</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {user.streaks > 0 ? "Completo" : "Pendente"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Ranking Section - expanded to show full ranking */}
          <section className="md:col-span-2">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-green-50 border-b border-green-100">
                <CardTitle className="text-xl font-bold text-green-800">
                  Ranking Completo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {fullRanking.map((userRank, index) => (
                    <div
                      key={userRank.id}
                      className={`flex items-center justify-between p-4 ${
                        userRank.id === user.id
                          ? "bg-green-50"
                          : "hover:bg-green-50"
                      } transition-colors`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                            index + 1 === 1
                              ? "bg-yellow-400"
                              : index + 1 === 2
                              ? "bg-gray-300"
                              : index + 1 === 3
                              ? "bg-amber-600"
                              : "bg-green-100"
                          } text-white font-bold`}
                        >
                          {index + 1}
                        </div>
                        <Avatar className="mr-3">
                          <AvatarImage src={userRank.avatar} />
                          <AvatarFallback className="bg-green-700 text-white">
                            {userRank.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-800">
                            {userRank.name}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <span>{userRank.challengesCompleted} desafios</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-700 font-medium flex items-center">
                          🔥{" "}
                          <span className="ml-1">{userRank.streaks} dias</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <footer className="mt-12 border-t border-green-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 LeetCash - Torne-se um programador melhor, ganhando enquanto
            aprende.
          </p>
        </div>
      </footer>
    </div>
  );
}
