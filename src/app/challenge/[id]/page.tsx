
"use client";
import { useEffect, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import { CodeEditor } from "@/components/code-editor";
import { app, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, Timestamp, runTransaction, increment } from "firebase/firestore";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import type { Challenge } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCcw, Code, Loader2, Bug, Play, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChallenge } from "../layout";
import { evaluateCode } from "@/ai/flows/evaluate-code";
import { debugCode } from "@/ai/flows/debug-code";

export default function ChallengeDetail() {
  const { challenge, runResult, debugOutput, setRunResult, setDebugOutput, setActiveTab, isRunning, setIsRunning, isResultsPanelFolded, setIsResultsPanelFolded } = useChallenge();
  const { toast } = useToast();
  const [solution, setSolution] = useState("");
  const [language, setLanguage] = useState('');
  const [initialSolution, setInitialSolution] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const params = useParams();
  const challengeId = params.id as string;
  
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!challenge) return;
    const availableLangs = challenge.languages || [];
    const firstLang = availableLangs.length > 0 ? availableLangs[0] : 'Python';
    setLanguage(firstLang.toLowerCase());

    const fetchSolution = async () => {
      let userCode = (challenge.starterCode && challenge.starterCode[firstLang]) || '';

      if (user) {
        const solRef = doc(db, `users/${user.uid}/solutions`, challenge.id!);
        const solSnap = await getDoc(solRef);
        if (solSnap.exists()) {
          const data = solSnap.data();
          // Check if saved language is available for this challenge
          if(availableLangs.includes(data.language)) {
             userCode = data.code;
             setLanguage(data.language.toLowerCase());
          } else if (challenge.starterCode) {
             // If not, fall back to the first available language's starter code
             userCode = challenge.starterCode[availableLangs[0]] || '';
          }
        }
      }
      setSolution(userCode || '');
      setInitialSolution(userCode || '');
    };

    fetchSolution();
  }, [challenge, user]);

  useEffect(() => {
    if (challenge && language && challenge.starterCode) {
        const starter = challenge.starterCode[language] || '';
        setSolution(sol => sol || starter); // Only set starter if current solution is empty
        setInitialSolution(sol => sol || starter);
    }
  }, [language, challenge]);


  const handleSolutionChange = (newCode: string) => {
    setSolution(newCode);
  };
  
  const handleSave = async () => {
    if (!user || !challenge) {
       toast({ variant: "destructive", title: "Error", description: "You must be logged in to save your progress." });
       return;
    }
    setIsSaving(true);
    try {
        const solRef = doc(db, `users/${user.uid}/solutions`, challenge.id!);
        await setDoc(solRef, { code: solution || '', language, updatedAt: new Date() }, { merge: true });
        
        const inProgressRef = doc(db, `users/${user.uid}/challengeData`, 'inProgress');
        await setDoc(inProgressRef, { [challenge.id!]: true }, { merge: true });
        
        toast({ title: "Progress Saved!", description: "Your code has been saved successfully." });
        
        setInitialSolution(solution || '');
    } catch (error) {
        console.error("Failed to save solution:", error);
         toast({ variant: "destructive", title: "Save Failed", description: "Could not save your code. Please try again." });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleRunCode = async () => {
    if (!challenge) return;
    
    const visibleTestCases = challenge.examples.map(ex => ({ input: ex.input, output: ex.output }));
    
    if (!visibleTestCases || visibleTestCases.length === 0) {
        toast({
            variant: "destructive",
            title: "Missing Test Cases",
            description: "This challenge has no example test cases to run against. You can still submit.",
        });
        return;
    }
    
    setIsRunning(true);
    setRunResult({ feedback: '', results: [], allPassed: false }); // Show loading state in results
    setDebugOutput(null);
    setActiveTab('result'); // Switch to result tab
    try {
        const result = await evaluateCode({
            code: solution,
            programmingLanguage: language,
            problemDescription: challenge.description,
            testCases: visibleTestCases,
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
        setRunResult(null); // Clear loading state on error
    } finally {
        setIsRunning(false);
    }
  }

  const handleDebugCode = async () => {
    if (!challenge) return;
    const sampleInput = challenge.examples[0]?.input || '';
    setIsRunning(true);
    setRunResult(null);
    setDebugOutput({ stdout: '', stderr: 'Running in debug mode...' });
    setActiveTab('result');

    try {
      const result = await debugCode({
        code: solution,
        programmingLanguage: language,
        input: sampleInput,
      });
      setDebugOutput(result);
    } catch(error) {
      console.error("Error debugging code:", error);
      toast({ variant: "destructive", title: "Debug Error", description: "Could not run the code for debugging." });
      setDebugOutput(null);
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
            const solRef = doc(db, `users/${user.uid}/solutions`, challenge.id!);
            
            const [userSnap, completedChallengesSnap] = await Promise.all([
                transaction.get(userRef),
                transaction.get(completedChallengesDocRef)
            ]);
            
            const completedData = completedChallengesSnap.exists() ? completedChallengesSnap.data() : {};
            
            // Save the accepted solution
            transaction.set(solRef, { code: solution || '', language, updatedAt: new Date() }, { merge: true });

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
  }

  const handleReset = () => {
      if(window.confirm("Are you sure you want to reset your code to your last saved version?")) {
          setSolution(initialSolution);
      }
  };
  
  const availableLanguages = challenge?.languages || [];
  
  return (
    <div className="h-full w-full flex flex-col bg-background">
       <div className="flex-shrink-0 p-2 flex justify-between items-center border-b bg-muted">
         <Select value={language} onValueChange={setLanguage} disabled={availableLanguages.length <= 1}>
             <SelectTrigger className="w-[180px]">
                 <SelectValue placeholder="Select language" />
             </SelectTrigger>
             <SelectContent>
                {availableLanguages.map(lang => (
                    <SelectItem key={lang} value={lang.toLowerCase()}>{lang}</SelectItem>
                ))}
             </SelectContent>
         </Select>
         <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving || isRunning}>
             <RefreshCcw className="mr-2 h-4 w-4" /> Reset
           </Button>
           <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={isSaving || isRunning}>
            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save
           </Button>
         </div>
       </div>
       <div className="flex-grow relative bg-white pr-[2px]">
            <CodeEditor
                value={solution}
                onChange={handleSolutionChange}
                language={language}
            />
       </div>
        <footer className="shrink-0 flex items-center justify-between p-2 border-t bg-muted gap-2">
            <div>
                 {(isRunning || runResult || debugOutput) && (
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsResultsPanelFolded(!isResultsPanelFolded)}>
                        {isResultsPanelFolded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                 )}
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="text-orange-500 border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-600" onClick={handleDebugCode} disabled={isSaving || isRunning}>
                    <Bug className="mr-2 h-4 w-4" /> Debug
                </Button>
                 <Button size="sm" variant="secondary" onClick={handleRunCode} disabled={isSaving || isRunning}>
                    {isRunning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />} Run
                </Button>
                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={isSaving || isRunning}>
                    {isRunning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null} Submit
                </Button>
            </div>
        </footer>
    </div>
  );
}

    
