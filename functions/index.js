const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Callable function: delete spins server-side.
// Requires the caller to have admin custom claim.
exports.adminDeleteSpins = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  if (!context.auth.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin privileges required.');
  }

  const ids = Array.isArray(data?.ids) ? data.ids.filter(Boolean) : [];
  if (ids.length === 0) {
    return { deleted: 0 };
  }

  // Delete in chunks under 500 ops per batch
  const chunkSize = 400;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const batch = db.batch();
    const chunk = ids.slice(i, i + chunkSize);
    chunk.forEach((id) => batch.delete(db.collection('spins').doc(String(id))));
    await batch.commit();
    deleted += chunk.length;
  }

  return { deleted };
});

// One-time HTTP endpoint to set admin claim for a user.
// Protect with a secret provided via environment variable ADMIN_SETUP_SECRET.
// Usage: GET/POST /setAdminClaim?uid=<UID>&secret=<SECRET>
exports.setAdminClaimHttp = functions.https.onRequest(async (req, res) => {
  // Simple CORS for manual calls
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');

  const provided = (req.query.secret || req.body?.secret || req.headers['x-admin-setup-secret']) ?? '';
  const expected = process.env.ADMIN_SETUP_SECRET || functions.config()?.admin?.setup_secret;
  if (!expected) {
    return res.status(500).json({ ok: false, error: 'Missing server secret (ADMIN_SETUP_SECRET or functions config admin.setup_secret).' });
  }
  if (provided !== expected) {
    return res.status(403).json({ ok: false, error: 'Forbidden: invalid secret' });
  }

  const uid = (req.query.uid || req.body?.uid || '').toString().trim();
  if (!uid) return res.status(400).json({ ok: false, error: 'uid is required' });

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    await admin.auth().revokeRefreshTokens(uid);
    return res.json({ ok: true, uid });
  } catch (e) {
    console.error('setAdminClaim error', e);
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});
