

"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CodeEditor } from "@/components/code-editor";
import { app, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, Timestamp, runTransaction, increment } from "firebase/firestore";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import type { Challenge } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCcw, Code, Bug, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChallenge } from "../layout";
import { evaluateCode, type EvaluateCodeOutput } from "@/ai/flows/evaluate-code";

export default function ChallengeDetail() {
  const { challenge, setRunResult, setActiveTab, isRunning, setIsRunning } = useChallenge();
  const { toast } = useToast();
  const [solution, setSolution] = useState("");
  const [language, setLanguage] = useState('python');
  const [initialSolution, setInitialSolution] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { id: challengeId } = useParams();
  
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
          userCode = solSnap.data().code;
          setLanguage(solSnap.data().language || challenge.language.toLowerCase());
        }
      }
      setSolution(userCode);
      setInitialSolution(userCode);
    };

    fetchSolution();
  }, [challenge, user]);


  const handleSolutionChange = (newCode: string) => {
    setSolution(newCode);
  };
  
  const handleSave = async () => {
    if (!user || !challenge) {
       toast({ variant: "destructive", title: "Error", description: "You must be logged in to save your progress.", position: 'center' });
       return;
    }
    setIsSaving(true);
    try {
        const solRef = doc(db, `users/${user.uid}/solutions`, challenge.id!);
        await setDoc(solRef, { code: solution, language, updatedAt: new Date() }, { merge: true });
        const inProgressRef = doc(db, `users/${user.uid}/challengeData`, 'inProgress');
        await setDoc(inProgressRef, { [challenge.id!]: true }, { merge: true });
        toast({ title: "Progress Saved!", description: "Your code has been saved successfully.", position: 'center' });
        setInitialSolution(solution);
    } catch (error) {
        console.error("Failed to save solution:", error);
         toast({ variant: "destructive", title: "Save Failed", description: "Could not save your code. Please try again.", position: 'center' });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleRunCode = async () => {
    if (!challenge) return;

    const visibleTestCases = challenge.testCases?.filter(tc => !tc.isHidden);
    
    console.log("Running with challenge data:", challenge);

    if (!visibleTestCases || visibleTestCases.length === 0) {
        toast({
            variant: "destructive",
            title: "Missing Test Cases",
            description: "This challenge has no visible test cases to run against. You can still submit.",
            position: 'center',
        });
        return;
    }
    
    setIsRunning(true);
    setRunResult(null); // Clear previous results
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
            toast({ title: "All Visible Tests Passed!", description: "You can now try submitting your solution.", position: 'center' });
        } else {
             toast({ variant: "destructive", title: "Tests Failed", description: "Some test cases did not pass. Check the results.", position: 'center' });
        }
    } catch(error) {
        console.error("Error running code:", error);
        toast({ variant: "destructive", title: "Evaluation Error", description: "Could not evaluate your code. Please try again.", position: 'center' });
    } finally {
        setIsRunning(false);
    }
  }
  
  const handleSubmit = async () => {
    if (!user || !challenge || !challengeId) {
        toast({ variant: "destructive", title: "Submission Error", description: "You must be logged in to submit.", position: 'center' });
        return;
    }
    setIsRunning(true);
    setRunResult(null);
    setActiveTab('result');

    try {
      const allTestCases = challenge.testCases || [];
      if (allTestCases.length === 0) {
         toast({ variant: "destructive", title: "No Test Cases", description: "Cannot submit, no test cases exist.", position: 'center' });
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
        // Use a transaction to ensure atomicity
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", user.uid);
            const completedChallengesDocRef = doc(db, `users/${user.uid}/challengeData`, 'completed');
            
            const [userSnap, completedChallengesSnap] = await Promise.all([
                transaction.get(userRef),
                transaction.get(completedChallengesDocRef)
            ]);
            
            const completedData = completedChallengesSnap.exists() ? completedChallengesSnap.data() : {};
            
            if (!completedData[challenge.id!]) {
                // Not completed before, award points
                transaction.update(userRef, { points: increment(challenge.points) });
                
                // Track daily points
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                const dailyPointsRef = doc(db, `users/${user.uid}/daily_points`, today);
                transaction.set(dailyPointsRef, { points: increment(challenge.points) }, { merge: true });

                // Mark as completed
                transaction.set(completedChallengesDocRef, { 
                    [challenge.id!]: { completedAt: Timestamp.now() }
                }, { merge: true });

                toast({ title: "Challenge Solved!", description: `You've earned ${challenge.points} points!`, position: 'center' });
            } else {
                 toast({ title: "Challenge Accepted!", description: "You have already completed this challenge.", position: 'center' });
            }

            // Update progress status
            const inProgressRef = doc(db, `users/${user.uid}/challengeData`, 'inProgress');
            transaction.set(inProgressRef, { [challenge.id!]: false }, { merge: true });
        });
        
        setActiveTab('submissions');
      } else {
        toast({ variant: "destructive", title: "Submission Failed", description: "Your solution did not pass all test cases (including hidden ones).", position: 'center' });
      }

    } catch (error) {
      console.error("Error submitting code:", error);
      toast({ variant: "destructive", title: "Submission Error", description: "An error occurred during submission.", position: 'center' });
    } finally {
      setIsRunning(false);
    }
  }


  const handleReset = () => {
      if(window.confirm("Are you sure you want to reset your code to your last saved version?")) {
          setSolution(initialSolution);
      }
  };

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
         <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving || isRunning}>
             <RefreshCcw className="mr-2 h-4 w-4" /> Reset
           </Button>
           <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving || isRunning}>
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
       <div className="flex-shrink-0 p-2 flex justify-end items-center gap-2 border-t bg-muted">
           <Button size="sm" onClick={handleRunCode} disabled={isSaving || isRunning}>
             {isRunning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Code className="mr-2 h-4 w-4" />} Run Code
           </Button>
           <Button size="sm" variant="default" onClick={handleSubmit} disabled={isSaving || isRunning}>
             {isRunning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Bug className="mr-2 h-4 w-4" />} Submit
           </Button>
       </div>
    </div>
  );
}
