import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Использование:
// node scripts/setRole.js <user-email> <role>
// Пример:
// node scripts/setRole.js admin@example.com admin

const args = process.argv.slice(2);
const targetEmail = args[0];
const targetRole = args[1];

if (!targetEmail || !targetRole) {
  console.error('❌ Ошибка: Укажите email и роль.');
  console.error('💡 Использование: node scripts/setRole.js admin@example.com admin');
  process.exit(1);
}

const validRoles = ['user', 'moderator', 'admin'];
if (!validRoles.includes(targetRole)) {
  console.error(`❌ Ошибка: Роль '${targetRole}' недопустима. Разрешенные роли: ${validRoles.join(', ')}`);
  process.exit(1);
}

// ⚠️ Чтобы этот скрипт работал, тебе нужен serviceAccountKey.json 
// из Firebase Project settings -> Service accounts -> Generate new private key
// Положи его в папку scripts/ и НЕ добавляй в git!
try {
  const serviceAccount = JSON.parse(readFileSync(new URL('./serviceAccountKey.json', import.meta.url)));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  async function setRole() {
    try {
      const user = await admin.auth().getUserByEmail(targetEmail);
      await admin.auth().setCustomUserClaims(user.uid, { role: targetRole });
      
      // Обновляем роль в Firestore документах для UI
      const db = admin.firestore();
      
      const userRef = db.collection('users').doc(user.uid);
      await userRef.set({ role: targetRole }, { merge: true });

      const pubRef = db.collection('publicProfiles').doc(user.uid);
      await pubRef.set({ role: targetRole }, { merge: true });

      console.log(`✅ Успех: Пользователю ${targetEmail} (UID: ${user.uid}) выдана роль '${targetRole}'.`);
      process.exit(0);
    } catch (error) {
      console.error('❌ Ошибка при выдаче роли:', error.message);
      process.exit(1);
    }
  }

  setRole();

} catch (err) {
  console.error('❌ Ошибка инициализации: Не найден serviceAccountKey.json');
  console.error('Пожалуйста, скачай ключ из консоли Firebase и положи его в папку scripts/ (назови serviceAccountKey.json).');
  process.exit(1);
}
