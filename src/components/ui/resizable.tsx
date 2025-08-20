
"use client"

import { Panel as ResizablePanel, PanelGroup as ResizablePanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { cn } from "@/lib/utils"

const ResizableHandle = PanelResizeHandle

const ResizableHandleWithHandle = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PanelResizeHandle> & { children?: React.ReactNode}) => (
  <ResizableHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    <div className="z-10 flex h-fit w-fit items-center justify-center rounded-sm border bg-background">
        {children || <div className="h-4 w-3 rounded-sm border bg-border" />}
    </div>
  </ResizableHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle, ResizableHandleWithHandle }
