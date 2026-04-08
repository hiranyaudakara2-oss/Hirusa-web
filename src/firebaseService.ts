import { auth, db } from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  orderBy,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  whatsapp?: string;
  initialDescription?: string;
  role: 'client' | 'admin';
  createdAt: Timestamp;
}

export interface ProjectMessage {
  id: string;
  sender: 'admin' | 'client';
  text: string;
  createdAt: Timestamp;
}

export interface ProjectRequest {
  id: string;
  userId: string;
  websiteName: string;
  email: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Approved';
  createdAt: Timestamp;
  messages?: ProjectMessage[];
}

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const logout = () => signOut(auth);

export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
};

export const createUserProfile = async (profile: Partial<UserProfile>) => {
  if (!profile.uid) throw new Error('UID is required');
  const docRef = doc(db, 'users', profile.uid);
  const data = {
    ...profile,
    role: profile.role || 'client',
    createdAt: serverTimestamp(),
  };
  try {
    await setDoc(docRef, data);
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
    throw error;
  }
};

export const submitProjectRequest = async (project: Omit<ProjectRequest, 'id' | 'status' | 'createdAt'>) => {
  const colRef = collection(db, 'projects');
  try {
    return await addDoc(colRef, {
      ...project,
      status: 'Pending',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'projects');
    throw error;
  }
};

export const updateProjectStatus = async (projectId: string, status: ProjectRequest['status']) => {
  const docRef = doc(db, 'projects', projectId);
  try {
    return await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    throw error;
  }
};

export const sendMessage = async (projectId: string, sender: 'admin' | 'client', text: string) => {
  const colRef = collection(db, 'projects', projectId, 'messages');
  try {
    await addDoc(colRef, {
      sender,
      text,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${projectId}/messages`);
    throw error;
  }
};

export const subscribeToMessages = (projectId: string, callback: (messages: ProjectMessage[]) => void) => {
  const q = query(
    collection(db, 'projects', projectId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as ProjectMessage));
    callback(messages);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `projects/${projectId}/messages`);
  });
};

export const deleteProject = async (projectId: string) => {
  const docRef = doc(db, 'projects', projectId);
  try {
    return await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
    throw error;
  }
};

export const getProjectDetails = async (projectId: string) => {
  const docRef = doc(db, 'projects', projectId);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    
    const project = { id: docSnap.id, ...docSnap.data() } as ProjectRequest;
    const userProfile = await getUserProfile(project.userId);
    
    return { project, userProfile };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `projects/${projectId}`);
    return null;
  }
};

export const subscribeToProject = (projectId: string, callback: (data: { project: ProjectRequest; userProfile: UserProfile | null } | null) => void) => {
  const docRef = doc(db, 'projects', projectId);
  return onSnapshot(docRef, async (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }
    const project = { id: docSnap.id, ...docSnap.data() } as ProjectRequest;
    const userProfile = await getUserProfile(project.userId);
    callback({ project, userProfile });
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `projects/${projectId}`);
  });
};

export const subscribeToUserProjects = (userId: string, callback: (projects: ProjectRequest[]) => void) => {
  const q = query(
    collection(db, 'projects'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectRequest));
    callback(projects);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'projects');
  });
};

export const subscribeToAllProjects = (callback: (projects: ProjectRequest[]) => void) => {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectRequest));
    callback(projects);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'projects');
  });
};

export const subscribeToAllUsers = (callback: (users: UserProfile[]) => void) => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data() as UserProfile);
    callback(users);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'users');
  });
};

export const getAdminAccessKey = async () => {
  const docRef = doc(db, 'system', 'config');
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().accessKey as string;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'system/config');
    return null;
  }
};

export const updateAdminAccessKey = async (newKey: string) => {
  const docRef = doc(db, 'system', 'config');
  try {
    return await setDoc(docRef, { accessKey: newKey }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system/config');
    throw error;
  }
};

export const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
};
