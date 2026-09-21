$arquivo = ".\src\api.ts"

$conteudo = @'
const API_BASE_URL = "/core/api";

async function requisicao(endpoint: string, options: RequestInit = {}) {
  const resposta = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!resposta.ok) {
    const texto = await resposta.text();

    throw new Error(
      `Erro ${resposta.status} ao acessar ${endpoint}: ${texto}`
    );
  }

  return resposta.json();
}

export async function listarProdutos() {
  return requisicao("/produtos/");
}
'@

[System.IO.File]::WriteAllText(
    (Resolve-Path ".\src").Path + "\api.ts",
    $conteudo,
    (New-Object System.Text.UTF8Encoding($false))
)