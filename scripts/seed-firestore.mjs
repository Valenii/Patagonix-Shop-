/**
 * Carga productos de ejemplo en Firestore (coleccion `products`).
 *
 * Uso:  npm run seed
 *
 * Las Security Rules solo permiten escribir productos a un admin, asi que el
 * script inicia sesion con una cuenta admin (email + contrasena) usando el SDK
 * cliente, igual que la app. Lee la config de Firebase desde `.env`.
 * Credenciales opcionales por entorno: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 */
import { createInterface } from 'node:readline';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

try {
  process.loadEnvFile('.env');
} catch {
  console.error('No se encontro el archivo .env (ver .env.example).');
  process.exit(1);
}

const env = process.env;
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

// Imagenes de ejemplo (Unsplash); reemplazar por fotos reales subidas a S3.
const image = (photoId) => `https://images.unsplash.com/${photoId}?w=600&h=600&fit=crop&fm=jpg`;

const SAMPLE_PRODUCTS = [
  {
    name: 'Botas de trekking Andes Pro',
    description: 'Botas impermeables con suela Vibram y caña media para senderos de montaña.',
    price: 189990,
    category: 'calzado',
    imageUrl: image('photo-1520219306100-ec4afeeefe58'),
    stock: 12,
  },
  {
    name: 'Zapatillas trail Fitz Roy',
    description: 'Livianas y con buen agarre para correr en terreno tecnico y mixto.',
    price: 129990,
    category: 'calzado',
    imageUrl: image('photo-1542291026-7eec264c27ff'),
    stock: 20,
  },
  {
    name: 'Campera de pluma Torres',
    description: 'Campera de pluma de ganso 700 cuin, compactable y abrigada hasta -10 °C.',
    price: 219990,
    category: 'indumentaria',
    imageUrl: image('photo-1591047139829-d91aecb6caea'),
    stock: 8,
  },
  {
    name: 'Polar tecnico Lanin',
    description: 'Primera capa termica de polar respirable, ideal para actividades aerobicas en frio.',
    price: 59990,
    category: 'indumentaria',
    imageUrl: image('photo-1544923246-77307dd654cb'),
    stock: 25,
  },
  {
    name: 'Mochila Cerro Catedral 45L',
    description: 'Mochila de travesia con espaldar regulable, cubre mochila y acceso frontal.',
    price: 149990,
    category: 'mochilas',
    imageUrl: image('photo-1622260614153-03223fb72052'),
    stock: 10,
  },
  {
    name: 'Mochila de dia Nahuel 22L',
    description: 'Compacta y liviana, con porta hidratacion y bolsillos laterales de malla.',
    price: 69990,
    category: 'mochilas',
    imageUrl: image('photo-1553062407-98eeb64c6a62'),
    stock: 18,
  },
  {
    name: 'Carpa Patagonia 2P',
    description: 'Carpa doble techo para 2 personas, resistente a viento fuerte y columna de agua 3000 mm.',
    price: 259990,
    category: 'campamento',
    imageUrl: image('photo-1478131143081-80f7f84ca84d'),
    stock: 6,
  },
  {
    name: 'Linterna frontal Glaciar 400',
    description: 'Frontal recargable USB de 400 lumenes con luz roja y modo de bajo consumo.',
    price: 34990,
    category: 'accesorios',
    imageUrl: image('photo-1517824806704-9040b037703b'),
    stock: 30,
  },
];

function ask(question, { hidden = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    // Oculta lo que se escribe (contrasena) mostrando solo la pregunta.
    rl._writeToOutput = (text) => {
      if (text.includes(question)) rl.output.write(text);
    };
  }
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

async function main() {
  const email = env.SEED_ADMIN_EMAIL || (await ask('Email del admin: '));
  const password = env.SEED_ADMIN_PASSWORD || (await ask('Contrasena: ', { hidden: true }));

  const { user } = await signInWithEmailAndPassword(auth, email, password);

  const profile = await getDoc(doc(db, 'users', user.uid));
  if (profile.data()?.role !== 'admin') {
    throw new Error(`La cuenta ${email} no tiene rol admin (revisa users/${user.uid} en Firestore).`);
  }

  const existing = await getDocs(query(collection(db, 'products'), limit(100)));
  if (!existing.empty) {
    // Si los productos de ejemplo ya existen, solo actualiza sus imagenes.
    const imageByName = new Map(SAMPLE_PRODUCTS.map((p) => [p.name, p.imageUrl]));
    const outdated = existing.docs.filter((d) => {
      const imageUrl = imageByName.get(d.data().name);
      return imageUrl && d.data().imageUrl !== imageUrl;
    });
    if (outdated.length > 0) {
      const batch = writeBatch(db);
      for (const d of outdated) {
        batch.update(d.ref, { imageUrl: imageByName.get(d.data().name), updatedAt: serverTimestamp() });
      }
      await batch.commit();
      console.log(`Listo: se actualizaron las imagenes de ${outdated.length} productos de ejemplo.`);
      return;
    }

    const answer = await ask('Ya hay productos cargados. ¿Agregar los de ejemplo igual? (s/N) ');
    if (answer.toLowerCase() !== 's') {
      console.log('Cancelado, no se agrego nada.');
      return;
    }
  }

  const batch = writeBatch(db);
  for (const product of SAMPLE_PRODUCTS) {
    batch.set(doc(collection(db, 'products')), {
      ...product,
      ratingAverage: 0,
      ratingCount: 0,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  console.log(`Listo: se cargaron ${SAMPLE_PRODUCTS.length} productos de ejemplo.`);
}

main()
  .catch((error) => {
    console.error('Error:', error.code ?? '', error.message);
    process.exitCode = 1;
  })
  .finally(() => signOut(auth).then(() => process.exit()));
