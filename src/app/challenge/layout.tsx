
'use client'

import { LogOut, User, Home, XCircle, CheckCircle, AlertCircle, Code, Loader2, HelpCircle, GitDiff, ThumbsUp, Play, Bug, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, List } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { getAuth, onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, orderBy, onSnapshot, updateDoc, runTransaction, setDoc, increment, addDoc, getDocs, Timestamp, deleteField, serverTimestamp } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { SmecBattleCodeLogo } from '@/components/icons';
import confetti from 'canvas-confetti';


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
  isSubmitting: boolean;
  isChallengeCompleted: boolean;
  isResultsPanelFolded: boolean;
  setIsResultsPanelFolded: React.Dispatch<React.SetStateAction<boolean>>;
  solution: string;
  setSolution: React.Dispatch<React.SetStateAction<string>>;
  language: string | null;
  setLanguage: React.Dispatch<React.SetStateAction<string | null>>;
  handleRunCode: () => void;
  handleDebugCode: (customInput: string) => void;
  handleSubmit: () => void;
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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResultsPanelFolded, setIsResultsPanelFolded] = useState(true);
  const [solution, setSolution] = useState("");
  const [language, setLanguage] = useState<string | null>(null);
  
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);

  const auth = getAuth(app);
  const challengeId = params.id as string;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const startCooldown = () => {
    setIsSubmitting(true);
    setTimeout(() => {
        setIsSubmitting(false);
    }, 3000); // 3-second cooldown
  }

  const handleRunCode = useCallback(async () => {
    if (!challenge || !language) {
      toast({ variant: 'destructive', title: 'Cannot Run Code', description: 'The challenge data is still loading. Please wait a moment.' });
      return;
    }
    
    const testCasesToRun = challenge.examples.map(ex => ({ input: ex.input, output: ex.output }));
    
    if (!testCasesToRun || testCasesToRun.length === 0) {
        toast({ variant: "destructive", title: "Missing Test Cases", description: "No example test cases to run against." });
        return;
    }
    
    setIsRunning(true);
    startCooldown();
    setRunResult(null); 
    setDebugOutput(null);
    setActiveTab('result');

    try {
        const {evaluateCode} = await import("@/ai/flows/evaluate-code");
        const result = await evaluateCode({
            code: solution,
            programmingLanguage: language,
            problemDescription: challenge.description,
            testCases: testCasesToRun,
        });
        setRunResult(result);
        if (result.allPassed) {
            toast({ title: "All Example Tests Passed!", description: "You can now try submitting your solution." });
        } else {
             toast({ variant: "destructive", title: "Tests Failed", description: "Some example test cases did not pass. Check the results." });
        }
    } catch(error) {
        console.error("Error running code:", error);
        toast({ variant: "destructive", title: "Evaluation Error", description: "Could not evaluate your code. Please try again." });
        setRunResult(null);
    } finally {
        setIsRunning(false);
    }
  }, [challenge, language, solution, toast]);

  const handleDebugCode = useCallback(async (customInput: string) => {
    if (!challenge || !language) {
      toast({ variant: 'destructive', title: 'Cannot Run Code', description: 'The challenge data is still loading. Please wait a moment.' });
      return;
    }
    
    setIsRunning(true);
    startCooldown();
    setRunResult(null); 
    setDebugOutput(null);
    setActiveTab('result');

    try {
      const {debugCode} = await import("@/ai/flows/debug-code");
      const result = await debugCode({
          code: solution,
          programmingLanguage: language,
          input: customInput,
      });
      setDebugOutput(result);
    } catch(error) {
        console.error("Error running debug code:", error);
        toast({ variant: "destructive", title: "Debug Error", description: "Could not run your code for debugging." });
        setDebugOutput(null);
    } finally {
        setIsRunning(false);
    }
  }, [challenge, language, solution, toast]);

  const handleSubmit = useCallback(async () => {
    if (!currentUser || !challenge || !challengeId || !language) {
        toast({ variant: "destructive", title: "Submission Error", description: "You must be logged in to submit." });
        return;
    }
    setIsRunning(true);
    startCooldown();
    setRunResult({ feedback: '', results: [], allPassed: false });
    setDebugOutput(null);
    setActiveTab('result');

    try {
      const allTestCases = challenge.testCases || [];
      if (allTestCases.length === 0) {
         toast({ variant: "destructive", title: "No Test Cases", description: "Cannot submit, no test cases exist." });
         setIsRunning(false);
         setRunResult(null);
         return;
      }
      
      const {evaluateCode} = await import("@/ai/flows/evaluate-code");
      const result = await evaluateCode({
          code: solution,
          programmingLanguage: language,
          problemDescription: challenge.description,
          testCases: allTestCases,
      });

      setRunResult(result);
      
      const submissionStatus = result.allPassed ? 'Accepted' : 'Failed';

      const submissionsRef = collection(db, `users/${currentUser.uid}/submissions/${challengeId}/attempts`);
      await addDoc(submissionsRef, {
        code: solution,
        language: language,
        status: submissionStatus,
        timestamp: serverTimestamp(),
      });
      
      if (result.allPassed) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", currentUser.uid);
            const completedChallengesDocRef = doc(db, `users/${currentUser.uid}/challengeData`, 'completed');
            const solRef = doc(db, `users/${currentUser.uid}/solutions`, challenge.id!);
            
            const [userSnap, completedChallengesSnap] = await Promise.all([
                transaction.get(userRef),
                transaction.get(completedChallengesDocRef)
            ]);
            
            const completedData = completedChallengesSnap.exists() ? completedChallengesSnap.data() : {};
            
            transaction.set(solRef, { code: solution || '', language, updatedAt: new Date() }, { merge: true });

            if (!completedData[challenge.id!]) {
                transaction.update(userRef, { points: increment(challenge.points) });
                
                const today = new Date().toISOString().split('T')[0];
                const dailyPointsRef = doc(db, `users/${currentUser.uid}/daily_points`, today);
                transaction.set(dailyPointsRef, { points: increment(challenge.points) }, { merge: true });

                transaction.set(completedChallengesDocRef, { 
                    [challenge.id!]: { completedAt: Timestamp.now() }
                }, { merge: true });

                toast({ title: "Challenge Solved!", description: `You've earned ${challenge.points} points!` });
            } else {
                 toast({ title: "Challenge Accepted!", description: "You have already completed this challenge." });
            }

            const inProgressRef = doc(db, `users/${currentUser.uid}/challengeData`, 'inProgress');
            transaction.set(inProgressRef, { [challenge.id!]: false }, { merge: true });
        });
        
        setActiveTab('submissions');
      } else {
        toast({ variant: "destructive", title: "Submission Failed", description: "Your solution did not pass all test cases (including hidden ones)." });
      }

    } catch (error) {
      console.error("Error submitting code:", error);
      toast({ variant: "destructive", title: "Submission Error", description: "An error occurred during submission." });
    } finally {
      setIsRunning(false);
    }
  }, [currentUser, challenge, challengeId, solution, language, toast]);


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
          if (challengeData.languages && challengeData.languages.length > 0 && !language) {
            setLanguage(challengeData.languages[0]);
          }
        } else {
          setChallenge(null);
        }
        setIsChallengeLoading(false);
      });
      return () => unsubscribe();
    }
  }, [challengeId, language]);
  
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
    if(runResult || debugOutput) {
       setIsResultsPanelFolded(false); // Unfold panel when new results arrive
    }
  }, [runResult, debugOutput]);
  
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
        setHasLiked(!newHasLiked);
        setLikeCount(current => !newHasLiked ? current + 1 : current - 1);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const currentChallengeIndex = allChallenges.findIndex(c => c.id === challengeId);
  const prevChallengeId = currentChallengeIndex > 0 ? allChallenges[currentChallengeIndex - 1].id : null;
  const nextChallengeId = currentChallengeIndex < allChallenges.length - 1 ? allChallenges[currentChallengeIndex + 1].id : null;
  
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
      isSubmitting,
      isChallengeCompleted,
      isResultsPanelFolded,
      setIsResultsPanelFolded,
      solution,
      setSolution,
      language,
      setLanguage,
      handleRunCode,
      handleDebugCode,
      handleSubmit,
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
      <div className="h-full flex flex-col p-4">
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
    ) : (
      <div className="p-6">Challenge not found.</div>
    )
  );
  
  function DebugPanel() {
    const [customInput, setCustomInput] = useState(challenge?.examples[0]?.input || "");

    return (
        <div className="p-4 space-y-4">
            <div>
                <Label htmlFor="custom-input" className="text-sm">Custom Input</Label>
                <Textarea 
                    id="custom-input"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="font-mono text-xs mt-1"
                    rows={5}
                    placeholder="Enter your test input here..."
                />
            </div>
            <Button 
                onClick={() => handleDebugCode(customInput)}
                disabled={isRunning || isSubmitting}
                size="sm"
            >
                {isRunning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                Run Debugger
            </Button>
        </div>
    );
  }
  
  const testResultPanel = (
    <div className="h-full w-full bg-background flex flex-col">
      <header className="p-2 border-b flex justify-between items-center flex-shrink-0">
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
        <>
            {isRunning ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p className="font-semibold">Running...</p>
                </div>
            ) : runResult ? (
                <ScrollArea className="flex-grow">
                  <Accordion type="single" collapsible defaultValue="0" className="w-full">
                     {runResult.results.map((res, i) => (
                       <AccordionItem value={String(i)} key={i}>
                          <AccordionTrigger className="flex items-center gap-1.5 text-xs h-10 px-4">
                              Test Case {i + 1}
                              {res.passed ? <CheckCircle className="text-green-500 h-4 w-4" /> : <XCircle className="text-red-500 h-4 w-4" />}
                          </AccordionTrigger>
                          <AccordionContent className="p-4 space-y-4 bg-muted/50">
                               <div>
                                    <h4 className="font-semibold mb-1 text-sm">Input</h4>
                                    <Textarea readOnly value={res.testCaseInput} className="font-mono text-xs h-20" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <h4 className="font-semibold mb-1 text-xs">Your Output</h4>
                                        <Textarea readOnly value={res.actualOutput} className="font-mono text-xs h-20" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1 text-xs">Expected Output</h4>
                                        <Textarea readOnly value={res.expectedOutput} className="font-mono text-xs h-20" />
                                    </div>
                                </div>
                          </AccordionContent>
                       </AccordionItem>
                     ))}
                  </Accordion>
                </ScrollArea>
            ) : debugOutput ? (
                <div className="p-2 space-y-4">
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
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                    <Play className="h-8 w-8 mb-2" />
                    <p>Run your code to see test results.</p>
                </div>
            )}
        </>
  </div>
  );

  const leftPanel = (
    <div className="h-full flex flex-col bg-background">
       <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-shrink-0 p-2 border-b">
            <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="debug">Debug</TabsTrigger>
                <TabsTrigger value="result">Result</TabsTrigger>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-grow overflow-auto">
              <TabsContent value="description" className="mt-0 h-full">
                <ScrollArea className="h-full">
                  {isChallengeLoading ? (
                      <div className="space-y-4 p-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                  ) : descriptionPanelContent}
                </ScrollArea>
              </TabsContent>
               <TabsContent value="debug" className="mt-0 h-full">
                <DebugPanel />
              </TabsContent>
               <TabsContent value="result" className="mt-0 h-full">
                 <ScrollArea className="h-full">
                    {testResultPanel}
                 </ScrollArea>
              </TabsContent>
              <TabsContent value="submissions" className="mt-0 h-full">
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
              </TabsContent>
          </div>
        </Tabs>
    </div>
  );
  
  const renderDesktopLayout = () => (
     <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={40} minSize={30}>
        {leftPanel}
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={60} minSize={40}>
        {isChallengeLoading ? (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            children
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  const renderMobileLayout = () => (
     <ResizablePanelGroup direction="vertical">
      <ResizablePanel defaultSize={50} minSize={30}>
        <Tabs defaultValue="description" className="h-full flex flex-col">
          <div className="flex-shrink-0 p-2 border-b">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Problem</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-grow overflow-auto">
            <TabsContent value="description" className="mt-0 h-full">
              <ScrollArea className="h-full">
                  {descriptionPanelContent}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="code" className="mt-0 h-full">
              <div className="h-full w-full flex flex-col">
                <div className="flex-grow">{children}</div>
              </div>
            </TabsContent>
             <TabsContent value="result" className="mt-0 h-full">
                <ScrollArea className="h-full">
                  {testResultPanel}
                </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  const currentIndex = allChallenges.findIndex(c => c.id === challengeId);
  
  return (
    <ChallengeContext.Provider value={contextValue}>
        <div className="flex h-screen w-full flex-col overflow-hidden">
            <header className="flex-shrink-0 bg-slate-900 text-white h-14 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <SmecBattleCodeLogo className="h-7 w-7" />
                        <span className="font-semibold hidden sm:inline">SMEC Battle Code</span>
                    </Link>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild disabled={!prevChallengeId}>
                        <Link href={prevChallengeId ? `/challenge/${prevChallengeId}` : '#'}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Prev
                        </Link>
                    </Button>
                     <Button variant="outline" size="sm" asChild className="bg-transparent text-white hover:bg-white/10">
                        <Link href="/challenges">
                            <List className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild disabled={!nextChallengeId}>
                         <Link href={nextChallengeId ? `/challenge/${nextChallengeId}` : '#'}>
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                    </Button>
                 </div>
                 <div className="flex items-center gap-4">
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
