  // перехват Bearer
const token = await new Promise((resolve, reject) => {
  const originalFetch = window.fetch;

  const timeout = setTimeout(() => {
    window.fetch = originalFetch;
    reject("Не удалось автоматически поймать Bearer");
  }, 15000);

  window.fetch = async (...args) => {
    const [resource, config = {}] = args;

    const url =
      typeof resource === "string"
        ? resource
        : resource?.url;

    const headers = new Headers(
      config.headers || resource?.headers || {}
    );

    const auth = headers.get("Authorization");
    if (
      url?.includes("api.frendi.ai/message") &&
      auth
    ) {
      const match = url.match(/\/message\/([^?]+)/);

    if (match?.[1]) {
      window.frendiChatId = match[1];
      console.log("Chat ID пойман:", window.frendiChatId);
    }

  clearTimeout(timeout);

  window.fetch = originalFetch;

  console.log("Bearer автоматически получен");

  resolve(auth);
}

    return originalFetch(...args);
  };

  console.log(
    "Жду запрос Frendi... Прокрути чат или отправь сообщение."
  );
});

// перехват chatID

(async () => {
  const chatId = window.frendiChatId;
  if (!chatId) {
  throw new Error("Chat ID не найден. Прокрути чат или отправь сообщение, чтобы поймать API-запрос.");
}
  const perPage = 10;

console.log("Использую Bearer:", token);

  const delay = ms => new Promise(r => setTimeout(r, ms));

  async function loadPage(page) {
    const url =
      `https://api.frendi.ai/message/${chatId}?page=${page}&per_page=${perPage}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": token,
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      throw new Error(`Ошибка ${res.status} на странице ${page}`);
    }

    return await res.json();
  }

  console.log("Загружаю первую страницу...");




const allItems = [];

// page=0 новые сообщения
const zeroData = await loadPage(0).catch(() => null);
if (zeroData?.items?.length) {
  console.log(`Страница 0: ${zeroData.items.length} сообщений`);
  allItems.push(...zeroData.items);
}

const firstData = await loadPage(1);
console.log("API total:", firstData.total);
console.log("page 0 total:", zeroData?.total, "items:", zeroData?.items?.length);
const total = firstData.total;
const totalPages = Math.ceil(total / perPage);

allItems.push(...firstData.items);

console.log(`Всего страниц: ${totalPages}`);

for (let page = 2; page <= totalPages; page++) {
  const data = await loadPage(page);
  const items = data.items || [];

  console.log(
    `Страница ${page}/${totalPages}: ${items.length} сообщений`
  );

  allItems.push(...items);

  await delay(150);
}

console.log("До удаления дублей:", allItems.length);

const uniqueItems = [];
const seen = new Set();

for (const item of allItems) {
  const content =
    item.content ||
    item.text ||
    item.message ||
    item.body ||
    "";

  const key = `${item.role || item.sender || item.author || item.type || ""}::${content}`;

  if (!seen.has(key)) {
    seen.add(key);
    uniqueItems.push(item);
  }
}

console.log("После удаления дублей:", allItems.length);
allItems.length = 0;
allItems.push(...uniqueItems);

  allItems.sort((a, b) => {
  return new Date(a.created_at || 0) - new Date(b.created_at || 0);
});
  window.frendiAllItems = allItems;

  console.log(`ИТОГО: ${allItems.length} сообщений`);

  const text = allItems.map(item => {
    const content =
      item.content ||
      item.text ||
      item.message ||
      item.body ||
      "[нет текста]";

    const role =
      item.role ||
      item.sender ||
      item.author ||
      item.type ||
      "";

    const isUser =
      String(role).toLowerCase().includes("user") ||
      String(role).toLowerCase().includes("human");

    const author = isUser ? "Ты" : "Персонаж";

    return `${author}:\n${content}`;
  }).join("\n\n---\n\n");

  const jsonBlob = new Blob(
    [JSON.stringify(allItems, null, 2)],
    { type: "application/json;charset=utf-8" }
  );

  const jsonLink = document.createElement("a");
  jsonLink.href = URL.createObjectURL(jsonBlob);
  jsonLink.download = "frendi_full_export.json";
  jsonLink.click();

  const textBlob = new Blob(
    [text],
    { type: "text/plain;charset=utf-8" }
  );

  const textLink = document.createElement("a");
  textLink.href = URL.createObjectURL(textBlob);
  textLink.download = "frendi_full_export.txt";
  textLink.click();

  console.log("Экспорт завершён!");
})();