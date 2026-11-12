async function deleteWebhook(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    return (await fetch(url, { method: "DELETE", signal: controller.signal })).ok;
  } catch {
    return false;
  } finally {
    clearInterval(timer);
  }
}

export default deleteWebhook;
