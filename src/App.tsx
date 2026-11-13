import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { DesignedBackground } from './components/DesignedBackground';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { PostDetailModal } from './components/PostDetailModal';
import { PostEditorModal } from './components/PostEditorModal';
import { PostFeed } from './components/PostFeed';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isOwnerUser,
  OperationType,
  testFirestoreConnection,
} from './firebase';
import { PostCategory, PostRecord } from './types/post';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<PostCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);

  const [selectedPost, setSelectedPost] = useState<PostRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostRecord | null>(null);

  // Boot connection check
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Auth listener with hashed owner verification (no plaintext email in frontend)
  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      const ownerStatus = await isOwnerUser(currentUser);
      if (!active) return;
      setUser(currentUser);
      setIsOwner(ownerStatus);
      setAuthReady(true);
      if (!ownerStatus) {
        setShowDraftsOnly(false);
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  // Real-time public & owner post feed (public visitors view published posts without an account)
  useEffect(() => {
    if (!authReady) return;

    setPostsLoading(true);
    setPostsError(null);

    const postsCol = collection(db, 'posts');
    const postsQuery = isOwner
      ? query(postsCol)
      : query(postsCol, where('status', '==', 'published'));

    const unsub = onSnapshot(
      postsQuery,
      (snapshot) => {
        const loaded: PostRecord[] = snapshot.docs.map((d) => d.data() as PostRecord);
        setPosts(loaded);
        setPostsLoading(false);
      },
      (error) => {
        setPostsLoading(false);
        if (error.message.includes('Quota exceeded')) {
          setPostsError('سنووری ڕۆژانەی بنکەدراوە تێپەڕیوە. تکایە سبەینێ هەوڵبدەرەوە.');
        } else {
          setPostsError('نەتوانرا پۆستەکان باربکرێن. تکایە دواتر هەوڵبدەرەوە.');
        }
        try {
          handleFirestoreError(error, OperationType.LIST, 'posts');
        } catch {
          // Logged cleanly without crashing public view
        }
      }
    );

    return () => unsub();
  }, [authReady, isOwner]);

  const handleSignIn = useCallback(async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError('نەتوانرا چوونەژوورەوە ئەنجام بدرێت. تکایە دڵنیابە لە ڕێگەدان بە Popup.');
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signOut(auth);
      setShowDraftsOnly(false);
      setEditorOpen(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleOpenNewPost = useCallback(() => {
    if (!isOwner) return;
    setEditingPost(null);
    setEditorOpen(true);
  }, [isOwner]);

  const handleEditPost = useCallback(
    (post: PostRecord) => {
      if (!isOwner) return;
      setEditingPost(post);
      setEditorOpen(true);
    },
    [isOwner]
  );

  const handleDeletePost = useCallback(
    async (post: PostRecord) => {
      if (!isOwner) return;
      const galleryColPath = `posts/${post.id}/gallery`;
      try {
        const gallerySnap = await getDocs(collection(db, 'posts', post.id, 'gallery'));
        for (const docItem of gallerySnap.docs) {
          await deleteDoc(doc(db, 'posts', post.id, 'gallery', docItem.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, galleryColPath);
      }

      const postPath = `posts/${post.id}`;
      try {
        await deleteDoc(doc(db, 'posts', post.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, postPath);
      }
    },
    [isOwner]
  );

  const handleToggleFeature = useCallback(
    async (post: PostRecord) => {
      if (!isOwner) return;
      const postPath = `posts/${post.id}`;
      try {
        await updateDoc(doc(db, 'posts', post.id), {
          featured: !post.featured,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, postPath);
      }
    },
    [isOwner]
  );

  const totalPublished = posts.filter((p) => p.status === 'published').length;
  const totalDrafts = posts.filter((p) => p.status === 'draft').length;

  return (
    <div className="relative flex min-h-screen flex-col text-slate-100">
      <DesignedBackground />

      <Header
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setShowDraftsOnly(false);
        }}
        isOwner={isOwner}
        isSignedIn={Boolean(user)}
        authLoading={authLoading}
        onOpenNewPost={handleOpenNewPost}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      <main className="flex-1">
        <HeroSection
          isOwner={isOwner}
          isSignedIn={Boolean(user)}
          totalPublished={totalPublished}
          totalDrafts={totalDrafts}
          showDraftsOnly={showDraftsOnly}
          onToggleDraftsOnly={() => setShowDraftsOnly((prev) => !prev)}
          onOpenNewPost={handleOpenNewPost}
          onSignOut={handleSignOut}
          authError={authError}
        />

        <PostFeed
          posts={posts}
          loading={postsLoading}
          error={postsError}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isOwner={isOwner}
          showDraftsOnly={showDraftsOnly}
          onOpenNewPost={handleOpenNewPost}
          onOpenPost={(post) => setSelectedPost(post)}
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
          onToggleFeature={handleToggleFeature}
        />
      </main>

      <Footer
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setShowDraftsOnly(false);
        }}
      />

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          isOwner={isOwner}
          onClose={() => setSelectedPost(null)}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
        />
      )}

      {editorOpen && isOwner && (
        <PostEditorModal
          existingPost={editingPost}
          onClose={() => {
            setEditorOpen(false);
            setEditingPost(null);
          }}
          onSaved={() => {
            // Snapshot listener updates UI automatically
          }}
        />
      )}
    </div>
  );
}
