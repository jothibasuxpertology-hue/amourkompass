// @ts-nocheck
export class Timestamp {
  seconds: number;
  nanoseconds: number;
  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
  static fromMillis(millis: number) {
    return new Timestamp(Math.floor(millis / 1000), (millis % 1000) * 1000000);
  }
  toMillis() {
    return this.seconds * 1000 + this.nanoseconds / 1000000;
  }
}
export const serverTimestamp = () => Timestamp.fromMillis(Date.now());

export const collection = (db: any, ...paths: string[]) => ({ type: 'collection', path: paths.join('/') });
export const doc = (db: any, ...paths: string[]) => {
  // If the last argument is undefined, filter it out so we don't end up with /undefined
  const validPaths = paths.filter(p => p !== undefined);
  return { type: 'doc', path: validPaths.join('/') };
};
export const query = (col: any, ...constraints: any[]) => ({ type: 'query', col, constraints });
export const where = (field: string, op: string, value: any) => ({ type: 'where', field, op, value });
export const orderBy = (field: string, dir: string) => ({ type: 'orderBy', field, dir });
export const limit = (n: number) => ({ type: 'limit', n });

function resolvePath(ref: any) {
  if (ref.type === 'doc' || ref.type === 'collection') return ref.path;
  if (ref.type === 'query') return ref.col.path;
  return ref;
}

export const setDoc = async (ref: any, data: any, options?: any) => {
  const path = resolvePath(ref);
  if (path.startsWith('users/')) {
    const uid = path.split('/')[1];
    await fetch(`/api/users/${uid}/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } else if (path.startsWith('chats/')) {
    const id = path.split('/')[1];
    await fetch(`/api/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data })
    });
  }
};

export const updateDoc = async (ref: any, data: any) => {
  const path = resolvePath(ref);
  if (path.startsWith('users/')) {
    const uid = path.split('/')[1];
    await fetch(`/api/users/${uid}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } else if (path.startsWith('chats/') && !path.includes('/messages/')) {
    const id = path.split('/')[1];
    if (data.active === false) {
      await fetch(`/api/chats/${id}/end`, { method: 'POST' });
    }
  }
};

export const addDoc = async (colRef: any, data: any) => {
  const path = resolvePath(colRef);
  if (path.includes('/messages')) {
    const chatId = path.split('/')[1];
    const res = await fetch(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const { id } = await res.json();
    return doc(null, `${path}/${id}`);
  }
};

export const getDoc = async (ref: any) => {
  const path = resolvePath(ref);
  let url = '';
  if (path.startsWith('users/')) {
    url = `/api/users/${path.split('/')[1]}`;
  } else if (path.startsWith('chats/')) {
    url = `/api/chats/${path.split('/')[1]}`;
  }
  const res = await fetch(url);
  if (!res.ok) return { exists: () => false, data: () => undefined };
  const data = await res.json();
  if (data.lastSeen) data.lastSeen = Timestamp.fromMillis(data.lastSeen);
  if (data.createdAt) data.createdAt = Timestamp.fromMillis(data.createdAt);
  return { exists: () => true, data: () => data };
};

export const getDocs = async (queryRef: any) => {
  const path = resolvePath(queryRef);
  let res, data;
  if (path === 'users') {
    res = await fetch('/api/users');
    data = await res.json();
    return { docs: data.users.map((u: any) => {
      u.lastSeen = Timestamp.fromMillis(u.lastSeen);
      u.createdAt = Timestamp.fromMillis(u.createdAt);
      return { id: u.uid, data: () => u };
    }) };
  }
  return { docs: [] };
};

export const onSnapshot = (ref: any, onNext: any, onError?: any) => {
  const path = resolvePath(ref);
  
  let stopped = false;
  
  const poll = async () => {
    if (stopped) return;
    try {
      if (path === 'users') {
        const res = await fetch('/api/users');
        const data = await res.json();
        const docs = data.users.map((u: any) => {
          u.lastSeen = Timestamp.fromMillis(u.lastSeen);
          if (u.createdAt) u.createdAt = Timestamp.fromMillis(u.createdAt);
          return { id: u.uid, data: () => u };
        });
        onNext({ docs });
      } else if (path.startsWith('users/')) {
        const res = await getDoc(ref);
        if (res.exists()) {
          onNext({ data: res.data });
        }
      } else if (path.includes('/messages')) {
        const chatId = path.split('/')[1];
        const res = await fetch(`/api/chats/${chatId}/messages`);
        const data = await res.json();
        const docs = data.messages.map((m: any) => {
          m.timestamp = Timestamp.fromMillis(m.timestamp);
          return { id: m.id, data: () => m };
        });
        onNext({ docs });
      } else if (path === 'chats') {
        // Find chats where user1_uid == user.uid or user2_uid == user.uid
        // We'd need to extract the user uid from the query constraints... this is tricky.
        // Let's rely on polling the active user's chats
        let userUid = '';
        if (ref.type === 'query' && ref.constraints) {
          ref.constraints.forEach(c => {
            if (c.type === 'where' && c.field === 'users') {
               userUid = c.value; // It is usually just a string
            }
          });
        }
        if (userUid) {
          const res = await fetch(`/api/users/${userUid}/chats`);
          const data = await res.json();
          const docs = data.chats.map(c => ({ id: c.id, data: () => c }));
          onNext({ docs });
        }
      }
    } catch (e) {
      if (onError) onError(e);
    }
    
    if (!stopped) {
      setTimeout(poll, 3000);
    }
  };
  
  poll();
  
  return () => { stopped = true; };
};
