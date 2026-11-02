export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send("Sin código");

  const CLIENT_ID = process.env.PATREON_CLIENT_ID;
  const CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET;
  const REDIRECT_URI = process.env.PATREON_REDIRECT_URI;

  // Intercambiar código por token
  const tokenRes = await fetch("https://www.patreon.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return res.status(400).send("Error de token");

  // Verificar si es suscriptor
  const memberRes = await fetch(
    "https://www.patreon.com/api/oauth2/v2/identity?include=memberships.currently_entitled_tiers&fields%5Bmember%5D=patron_status,currently_entitled_amount_cents",
    { headers: { Authorization: "Bearer " + tokenData.access_token } }
  );
  const memberData = await memberRes.json();

  const memberships = memberData.included || [];
  const isPaid = memberships.some(m =>
    m.type === "member" &&
    m.attributes.patron_status === "active_patron" &&
    m.attributes.currently_entitled_amount_cents >= 300
  );

  // Redirigir de vuelta con el resultado
  res.redirect(`/?patron=${isPaid ? "1" : "0"}&token=${tokenData.access_token}`);
}
