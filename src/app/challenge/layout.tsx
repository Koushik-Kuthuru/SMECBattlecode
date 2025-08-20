

'use client'

import { LogOut, User, Home, XCircle, CheckCircle, AlertCircle, Code, Loader2, HelpCircle, GitDiff, ThumbsUp, Play, Bug, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, List } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { getAuth, onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, orderBy, onSnapshot, updateDoc, runTransaction, setDoc, increment, getDocs, Timestamp, deleteField } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandleWithHandle,
} from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Challenge } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { type EvaluateCodeOutput } from '@/ai/flows/evaluate-code';
import { type DebugCodeOutput } from '@/ai/flows/debug-code';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SmecBattleCodeLogo, BulletCoin } from '@/components/icons';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


type CurrentUser = {
  uid: string;
  name: string;
  email: string;
  imageUrl?: string;
}

export type Submission = {
  id: string;
  code: string;
  language: string;
  status: 'Accepted' | 'Failed';
  timestamp: {
    seconds: number;
    nanoseconds: number;
  } | null;
};

type ChallengeContextType = {
  challenge: Challenge | null;
  runResult: EvaluateCodeOutput | null;
  setRunResult: React.Dispatch<React.SetStateAction<EvaluateCodeOutput | null>>;
  debugOutput: DebugCodeOutput | null;
  setDebugOutput: React.Dispatch<React.SetStateAction<DebugCodeOutput | null>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  isChallengeCompleted: boolean;
  isResultsPanelFolded: boolean;
  setIsResultsPanelFolded: React.Dispatch<React.SetStateAction<boolean>>;
};

const ChallengeContext = createContext<ChallengeContextType | null>(null);

export const useChallenge = () => {
    const context = useContext(ChallengeContext);
    if (!context) {
        throw new Error('useChallenge must be used within a ChallengeLayout');
    }
    return context;
}

export default function ChallengeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isChallengeLoading, setIsChallengeLoading] = useState(true);
  const [isChallengeCompleted, setIsChallengeCompleted] = useState(false);
  const [runResult, setRunResult] = useState<EvaluateCodeOutput | null>(null);
  const [debugOutput, setDebugOutput] = useState<DebugCodeOutput | null>(null);
  const [activeTab, setActiveTab] = useState('description');
  const [activeResultTab, setActiveResultTab] = useState('0');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isResultsPanelFolded, setIsResultsPanelFolded] = useState(false);
  
  // Like functionality state
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  // For next/prev navigation
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);

  const auth = getAuth(app);
  const challengeId = params.id as string;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then(userDoc => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setCurrentUser({
                uid: user.uid,
                name: userData.name,
                email: userData.email,
                imageUrl: userData.imageUrl,
              });
            } else {
              setCurrentUser(null);
            }
        });
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchAllChallenges = async () => {
        const challengesCollection = collection(db, 'challenges');
        const q = query(challengesCollection, orderBy('title'));
        const snapshot = await getDocs(q);
        const challengesList = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Challenge))
          .filter(c => c.isEnabled !== false);
        setAllChallenges(challengesList);
    };
    fetchAllChallenges();
  }, []);

  useEffect(() => {
    if (challengeId) {
      const challengeDocRef = doc(db, 'challenges', challengeId);
      const unsubscribe = onSnapshot(challengeDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const challengeData = { id: docSnap.id, ...docSnap.data() } as Challenge;
          setChallenge(challengeData);
          setLikeCount(challengeData.likes || 0);
        } else {
          setChallenge(null);
        }
        setIsChallengeLoading(false);
      });
      return () => unsubscribe();
    }
  }, [challengeId]);
  
  useEffect(() => {
      if (!currentUser || !challengeId) return;

      const setInProgress = async () => {
          const completedDocRef = doc(db, `users/${currentUser.uid}/challengeData`, 'completed');
          const completedSnap = await getDoc(completedDocRef);
          
          if (!completedSnap.exists() || !completedSnap.data()?.[challengeId]) {
              const inProgressRef = doc(db, `users/${currentUser.uid}/challengeData`, 'inProgress');
              await setDoc(inProgressRef, { [challengeId]: true }, { merge: true });
          }
      };
      setInProgress();
      
      const completedDocRef = doc(db, `users/${currentUser.uid}/challengeData`, 'completed');
      const unsubscribeCompleted = onSnapshot(completedDocRef, (docSnap) => {
          setIsChallengeCompleted(!!docSnap.data()?.[challengeId]);
      });

      const likesDocRef = doc(db, `users/${currentUser.uid}/challengeData`, 'likes');
      const unsubscribeLikes = onSnapshot(likesDocRef, (docSnap) => {
          setHasLiked(!!docSnap.data()?.[challengeId]);
      });

      return () => {
        unsubscribeCompleted();
        unsubscribeLikes();
      }
  }, [currentUser, challengeId]);

  useEffect(() => {
    if (!currentUser || !challengeId) return;

    const submissionsRef = collection(db, `users/${currentUser.uid}/submissions/${challengeId}/attempts`);
    const q = query(submissionsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userSubmissions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
      setSubmissions(userSubmissions);
    });

    return () => unsubscribe();
  }, [currentUser, challengeId]);


  useEffect(() => {
    if(runResult) {
        setActiveResultTab('0');
    }
  }, [runResult]);
  
  const handleLikeToggle = async () => {
    if (!currentUser || !challenge) return;

    const newHasLiked = !hasLiked;
    setHasLiked(newHasLiked);
    setLikeCount(current => newHasLiked ? current + 1 : current - 1);

    const challengeRef = doc(db, 'challenges', challenge.id!);
    const userLikesRef = doc(db, `users/${currentUser.uid}/challengeData`, 'likes');

    try {
        await runTransaction(db, async (transaction) => {
            transaction.update(challengeRef, {
                likes: increment(newHasLiked ? 1 : -1)
            });
            transaction.set(userLikesRef, {
                [challenge.id!]: newHasLiked ? true : deleteField()
            }, { merge: true });
        });
    } catch (error) {
        console.error('Error toggling like:', error);
        // Revert UI on error
        setHasLiked(!newHasLiked);
        setLikeCount(current => !newHasLiked ? current + 1 : current - 1);
    }
  };
  
  if (isLoading || isChallengeLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  const contextValue: ChallengeContextType = {
      challenge,
      runResult,
      setRunResult,
      debugOutput,
      setDebugOutput,
      activeTab,
      setActiveTab,
      isRunning,
      setIsRunning,
      isChallengeCompleted,
      isResultsPanelFolded,
      setIsResultsPanelFolded,
  };
  
  const difficultyColors = {
    Easy: 'text-green-500 border-green-500/50 bg-green-500/10',
    Medium: 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10',
    Hard: 'text-red-500 border-red-500/50 bg-red-500/10',
  };
  
  const difficultyTextColors = {
    Easy: 'text-green-500',
    Medium: 'text-yellow-600',
    Hard: 'text-red-600',
  }
  
  const statusBadge = isChallengeCompleted 
    ? <Badge variant="default" className="bg-green-600">Solved</Badge>
    : <Badge variant="secondary">Unsolved</Badge>;

  const descriptionPanelContent = (
    challenge ? (
      <div className="h-full flex flex-col">
        <div className="flex-grow overflow-auto p-4">
          <div className="flex justify-between items-start">
            <div>
               <h1 className="text-2xl font-bold mb-2">{challenge.title}</h1>
              <div className="flex items-center gap-4 text-sm">
                  {statusBadge}
                  <span className={cn("font-semibold", difficultyTextColors[challenge.difficulty])}>{challenge.difficulty}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 h-8" onClick={handleLikeToggle}>
              <ThumbsUp className={cn("h-4 w-4 transition-colors", hasLiked && "text-blue-500 fill-blue-500/20")} />
              <span className="font-semibold text-muted-foreground">{likeCount.toLocaleString()}</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4 whitespace-pre-wrap">{challenge.description}</p>
          
          {challenge.examples.map((example, index) => (
            <div key={index} className="mt-4">
                 <p className="font-semibold text-sm mb-1">Example {index + 1}:</p>
                 <div className="space-y-2 p-3 bg-muted rounded-md border text-sm">
                    <div>
                        <span className="font-semibold mr-2">Input:</span>
                        <code className="font-mono">{example.input}</code>
                    </div>
                    <div>
                        <span className="font-semibold mr-2">Output:</span>
                        <code className="font-mono">{example.output}</code>
                    </div>
                    {example.explanation && (
                        <div>
                            <span className="font-semibold mr-2">Explanation:</span>
                            <span className="text-muted-foreground">{example.explanation}</span>
                        </div>
                    )}
                </div>
            </div>
          ))}
        </div>
        <div className="shrink-0 p-4 border-t">
          <p className="text-xs text-muted-foreground text-center">Copyright © {new Date().getFullYear()} SMEC BattleCode. All rights reserved.</p>
        </div>
      </div>
    ) : (
      <div className="p-6">Challenge not found.</div>
    )
  );

  const descriptionPanel = (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Problem Description</h2>
      </div>
      {isChallengeLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
      ) : descriptionPanelContent}
    </div>
  );

  const submissionsPanel = (
     <ScrollArea className="h-full">
        <div className="p-4">
            {submissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <Badge variant={submission.status === 'Accepted' ? 'default' : 'destructive'}>
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{submission.language}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {submission.timestamp ? formatDistanceToNow(new Date(submission.timestamp.seconds * 1000), { addSuffix: true }) : 'Just now'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                  <AlertCircle className="h-10 w-10 mb-4" />
                  <p className="font-semibold">No Submissions Yet</p>
                  <p>Your submission history for this challenge will appear here.</p>
              </div>
            )}
        </div>
    </ScrollArea>
  );

  const testResultPanel = (
    <div className="h-full w-full bg-background flex flex-col border-t">
      <header className="p-2 border-b flex justify-between items-center">
        <h3 className="text-base font-semibold">Test Result</h3>
         <div className="flex items-center gap-2">
            {runResult && !isRunning && (
                <span className={cn(
                    "text-sm font-bold",
                    runResult.allPassed ? "text-green-600" : "text-red-500"
                )}>
                    {runResult.allPassed ? "Accepted" : "Wrong Answer"}
                </span>
            )}
            {debugOutput && !isRunning && <span className="text-sm font-bold text-blue-500">Debug Output</span>}
         </div>
      </header>
      {!isResultsPanelFolded && (
        <>
            {isRunning ? (
                <div className="flex flex-col items-center justify-center flex-grow text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p className="font-semibold">Running...</p>
                </div>
            ) : runResult ? (
                <Tabs value={activeResultTab} onValueChange={setActiveResultTab} className="flex-grow flex flex-col overflow-hidden">
                    <div className="p-2 border-b">
                        <TabsList className="h-auto p-1">
                            {runResult.results.map((res, i) => (
                                <TabsTrigger key={i} value={String(i)} className="flex items-center gap-1.5 text-xs h-8">
                                    Test Case {i + 1}
                                    {res.passed ? <CheckCircle className="text-green-500 h-4 w-4" /> : <XCircle className="text-red-500 h-4 w-4" />}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                    <div className="flex-grow overflow-auto">
                        {runResult.results.map((res, i) => (
                            <TabsContent key={i} value={String(i)} className="mt-0 p-4 space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-1 text-sm">Input</h4>
                                    <Textarea readOnly value={res.testCaseInput} className="font-mono text-xs h-20" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold mb-1 text-sm">Your Output</h4>
                                        <Textarea readOnly value={res.actualOutput} className="font-mono text-xs h-20" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1 text-sm">Expected Output</h4>
                                        <Textarea readOnly value={res.expectedOutput} className="font-mono text-xs h-20" />
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </div>
                    <footer className="p-2 border-t text-sm text-muted-foreground">{runResult.feedback}</footer>
                </Tabs>
            ) : debugOutput ? (
                <div className="flex-grow p-4 space-y-4 overflow-auto">
                    <div>
                        <h4 className="font-semibold mb-1 text-sm">Standard Output</h4>
                        <Textarea readOnly value={debugOutput.stdout || '(empty)'} className="font-mono text-xs h-32 bg-gray-100" />
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1 text-sm text-red-500">Standard Error</h4>
                        <Textarea readOnly value={debugOutput.stderr || '(empty)'} className="font-mono text-xs h-20 bg-red-50 text-red-700 border-red-200" />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-muted-foreground">
                    <Play className="h-8 w-8 mb-2" />
                    <p>Run your code to see test results.</p>
                </div>
            )}
        </>
      )}
  </div>
  );
  
  const bottomPanel = (
    <div className="h-full flex flex-col bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-shrink-0 p-2 border-b border-r">
            <div className="flex items-center justify-between">
                <TabsList>
                    <TabsTrigger value="result">Test Result</TabsTrigger>
                    <TabsTrigger value="submissions">Submissions</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="custom-input" />
                        <Label htmlFor="custom-input" className="text-sm">Custom Input</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="diff-mode" className="text-sm">Diff</Label>
                        <Switch id="diff-mode" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>
            </div>
          </div>
          <div className="flex-grow overflow-auto border-r">
              <TabsContent value="submissions" className="mt-0 h-full">
                {submissionsPanel}
              </TabsContent>
              <TabsContent value="result" className="mt-0 h-full">
                {testResultPanel}
              </TabsContent>
          </div>
        </Tabs>
    </div>
  );


  const renderDesktopLayout = () => (
     <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={40} minSize={30}>
        {descriptionPanel}
      </ResizablePanel>
      <ResizableHandleWithHandle>
        {(isRunning || runResult || debugOutput) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 bg-background border rounded-full shadow-md hover:bg-muted"
            onClick={() => setIsResultsPanelFolded(!isResultsPanelFolded)}
          >
            {isResultsPanelFolded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </Button>
        )}
      </ResizableHandleWithHandle>
      <ResizablePanel defaultSize={60} minSize={40}>
        <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={isResultsPanelFolded ? 100 : 60} minSize={25}>
                {isChallengeLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    children
                )}
            </ResizablePanel>
            {(isRunning || runResult || debugOutput) && !isResultsPanelFolded && (
                <>
                    <ResizableHandleWithHandle />
                    <ResizablePanel defaultSize={40} minSize={15}>
                        {testResultPanel}
                    </ResizablePanel>
                </>
            )}
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  const renderMobileLayout = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="flex-shrink-0 p-2 border-b">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="result">Result</TabsTrigger>
            </TabsList>
        </div>
        <div className="flex-grow overflow-auto">
            <TabsContent value="description" className="mt-0 h-full">
                {descriptionPanel}
            </TabsContent>
            <TabsContent value="code" className="mt-0 h-full">
                <div className="h-full w-full flex">
                    {children}
                </div>
            </TabsContent>
            <TabsContent value="result" className="mt-0 h-full">
                {bottomPanel}
            </TabsContent>
        </div>
    </Tabs>
  );

  const currentIndex = allChallenges.findIndex(c => c.id === challengeId);
  const prevChallengeId = currentIndex > 0 ? allChallenges[currentIndex - 1].id : null;
  const nextChallengeId = currentIndex < allChallenges.length - 1 ? allChallenges[currentIndex + 1].id : null;

  return (
    <ChallengeContext.Provider value={contextValue}>
        <div className="flex h-screen w-full flex-col overflow-hidden">
            <header className="flex-shrink-0 bg-slate-900 text-white h-14 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <SmecBattleCodeLogo className="h-7 w-7" />
                        <span className="font-semibold hidden sm:inline">SMEC Battle Code</span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" asChild disabled={!prevChallengeId}>
                            <Link href={prevChallengeId ? `/challenge/${prevChallengeId}` : '#'}>
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Prev
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild disabled={!nextChallengeId}>
                             <Link href={nextChallengeId ? `/challenge/${nextChallengeId}` : '#'}>
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                        </Button>
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" className="bg-transparent text-white hover:bg-white/10" asChild>
                        <Link href="/challenges">
                            <List className="h-4 w-4 mr-2" />
                            Problem List
                        </Link>
                    </Button>
                    {currentUser && (
                         <Link href="/profile">
                            <Avatar className="h-8 w-8">
                               <AvatarImage src={currentUser.imageUrl} alt={currentUser.name} />
                               <AvatarFallback>
                                 <User />
                               </AvatarFallback>
                             </Avatar>
                         </Link>
                    )}
                 </div>
            </header>
            <main className="flex-1 flex flex-row overflow-hidden bg-muted/40">
               {isDesktop ? renderDesktopLayout() : renderMobileLayout()}
            </main>
        </div>
        <Toaster />
    </ChallengeContext.Provider>
  );
}
