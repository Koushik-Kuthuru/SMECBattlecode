
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { CodeEditor } from "@/components/code-editor";
import { app, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, Timestamp, runTransaction, increment } from "firebase/firestore";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import type { Challenge } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCcw, Code, Bug, Loader2, CheckCircle, AlertTriangle, Circle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChallenge } from "../layout";
import { evaluateCode, type EvaluateCodeOutput } from "@/ai/flows/evaluate-code";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

export default function ChallengeDetail() {
  const { challenge, setRunResult, setActiveTab, isRunning, setIsRunning, isChallengeCompleted } = useChallenge();
  const { toast } = useToast();
  const [solution, setSolution] = useState("");
  const [language, setLanguage] = useState('python');
  const [lastSavedSolution, setLastSavedSolution] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const { id: challengeId } = useParams();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!challenge) return;

    const fetchSolution = async () => {
      setLanguage(challenge.language.toLowerCase());
      let userCode = challenge.starterCode; // Default to starter code

      if (user) {
        const solRef = doc(db, `users/${user.uid}/solutions`, challenge.id!);
        const solSnap = await getDoc(solRef);
        if (solSnap.exists()) {
          const data = solSnap.data();
          // Ensure data.code is not undefined before setting
          userCode = typeof data.code === 'string' ? data.code : challenge.starterCode;
          setLanguage(data.language || challenge.language.toLowerCase());
        }
      }
      setSolution(userCode);
      setLastSavedSolution(userCode);
      setSaveStatus('saved');
    };

    fetchSolution();
  }, [challenge, user]);

  const saveProgress = useCallback(async (code: string, lang: string) => {
    if (!user || !challenge || !challengeId || isChallengeCompleted || code === undefined) return;
    
    setSaveStatus('saving');
    try {
      const solRef = doc(db, `users/${user.uid}/solutions`, challenge.id!);
      await setDoc(solRef, { code, language: lang, updatedAt: serverTimestamp() }, { merge: true });

      const inProgressRef = doc(db, `users/${user.uid}/challengeData/inProgress`);
      await setDoc(inProgressRef, { [challengeId]: true }, { merge: true });
      
      setSaveStatus('saved');
      setLastSavedSolution(code); // Update the reset point to the last saved code
    } catch (error) {
      console.error("Failed to save solution:", error);
      setSaveStatus('error');
    }
  }, [user, challenge, challengeId, isChallengeCompleted]);

  useEffect(() => {
    if (solution !== lastSavedSolution && saveStatus !== 'saving') {
        setSaveStatus('unsaved');
    }

    if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
    }
    
    if (solution !== lastSavedSolution && !isChallengeCompleted) {
        debounceTimer.current = setTimeout(() => {
            saveProgress(solution, language);
        }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [solution, language, lastSavedSolution, saveProgress, isChallengeCompleted]);

  const handleSolutionChange = (newCode: string) => {
    setSolution(newCode);
  };
  
  const handleRunCode = async () => {
    if (!challenge) return;
    const visibleTestCases = challenge.testCases?.filter(tc => !tc.isHidden);
    
    if (!visibleTestCases || visibleTestCases.length === 0) {
        toast({
            variant: "destructive",
            title: "Missing Test Cases",
            description: "This challenge has no visible test cases to run against. You can still submit.",
        });
        return;
    }
    
    setIsRunning(true);
    setRunResult(null); 
    setActiveTab('result'); 
    try {
        const result = await evaluateCode({
            code: solution,
            programmingLanguage: language,
            problemDescription: challenge.description,
            testCases: visibleTestCases,
        });
        setRunResult(result);
        if (result.allPassed) {
            toast({ title: "All Visible Tests Passed!", description: "You can now try submitting your solution." });
        } else {
             toast({ variant: "destructive", title: "Tests Failed", description: "Some test cases did not pass. Check the results." });
        }
    } catch(error) {
        console.error("Error running code:", error);
        toast({ variant: "destructive", title: "Evaluation Error", description: "Could not evaluate your code. Please try again." });
    } finally {
        setIsRunning(false);
    }
  }
  
  const handleSubmit = async () => {
    if (!user || !challenge || !challengeId) {
        toast({ variant: "destructive", title: "Submission Error", description: "You must be logged in to submit." });
        return;
    }
    setIsRunning(true);
    setRunResult(null);
    setActiveTab('result');

    try {
      const allTestCases = challenge.testCases || [];
      if (allTestCases.length === 0) {
         toast({ variant: "destructive", title: "No Test Cases", description: "Cannot submit, no test cases exist." });
         setIsRunning(false);
         return;
      }
      
      const result = await evaluateCode({
          code: solution,
          programmingLanguage: language,
          problemDescription: challenge.description,
          testCases: allTestCases,
      });

      setRunResult(result);
      
      const submissionStatus = result.allPassed ? 'Accepted' : 'Failed';

      const submissionsRef = collection(db, `users/${user.uid}/submissions/${challengeId}/attempts`);
      await addDoc(submissionsRef, {
        code: solution,
        language: language,
        status: submissionStatus,
        timestamp: serverTimestamp(),
      });
      
      if (result.allPassed) {
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", user.uid);
            const completedChallengesDocRef = doc(db, `users/${user.uid}/challengeData`, 'completed');
            
            const [userSnap, completedChallengesSnap] = await Promise.all([
                transaction.get(userRef),
                transaction.get(completedChallengesDocRef)
            ]);
            
            const completedData = completedChallengesSnap.exists() ? completedChallengesSnap.data() : {};
            
            if (!completedData[challenge.id!]) {
                transaction.update(userRef, { points: increment(challenge.points) });
                
                const today = new Date().toISOString().split('T')[0];
                const dailyPointsRef = doc(db, `users/${user.uid}/daily_points`, today);
                transaction.set(dailyPointsRef, { points: increment(challenge.points) }, { merge: true });

                transaction.set(completedChallengesDocRef, { 
                    [challenge.id!]: { completedAt: Timestamp.now() }
                }, { merge: true });

                toast({ title: "Challenge Solved!", description: `You've earned ${challenge.points} points!` });
            } else {
                 toast({ title: "Challenge Accepted!", description: "You have already completed this challenge." });
            }

            const inProgressRef = doc(db, `users/${user.uid}/challengeData`, 'inProgress');
            transaction.set(inProgressRef, { [challengeId]: false }, { merge: true });
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
  }

  const handleReset = () => {
      if (challenge) {
          setSolution(challenge.starterCode);
          setSaveStatus('unsaved'); // Mark as unsaved to trigger auto-save
      }
  };

  const getStatusIndicator = () => {
    switch(saveStatus) {
        case 'saved':
            return <span className="flex items-center gap-1.5 text-sm text-green-600"><CheckCircle className="h-4 w-4" /> All changes saved</span>;
        case 'saving':
            return <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>;
        case 'unsaved':
            return <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Circle className="h-4 w-4" /> Unsaved changes</span>;
        case 'error':
            return <span className="flex items-center gap-1.5 text-sm text-red-600"><AlertTriangle className="h-4 w-4" /> Save failed</span>;
        default:
            return null;
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-background">
       <div className="flex-shrink-0 p-2 flex justify-between items-center border-b bg-muted">
         <Select value={language} onValueChange={setLanguage}>
             <SelectTrigger className="w-[180px]">
                 <SelectValue placeholder="Select language" />
             </SelectTrigger>
             <SelectContent>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="c++">C++</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
             </SelectContent>
         </Select>
         <div className="flex items-center gap-4">
           {!isChallengeCompleted && getStatusIndicator()}
           <div className="flex items-center gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isRunning}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will discard your current code and revert to the original starter code for this challenge. Your last saved progress will be overwritten.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
           </div>
         </div>
       </div>
       <div className="flex-grow relative bg-white p-2">
          <CodeEditor
            value={solution}
            onChange={handleSolutionChange}
            language={language}
          />
       </div>
       <div className="flex-shrink-0 p-2 flex justify-end items-center gap-2 border-t bg-muted">
           <Button size="sm" onClick={handleRunCode} disabled={isRunning}>
             {isRunning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Code className="mr-2 h-4 w-4" />} Run Code
           </Button>
           <Button size="sm" variant="default" onClick={handleSubmit} disabled={isRunning}>
             {isRunning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null} Submit
           </Button>
       </div>
    </div>
  );
}
