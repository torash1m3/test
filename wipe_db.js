import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// Инициализация. Пользователь должен будет запустить этот скрипт, если есть service_account_key.
// Но у меня нет ключа!
