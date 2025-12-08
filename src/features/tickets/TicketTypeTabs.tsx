import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TICKET_TYPE_STYLES, type TicketTypeKey } from "@/config/ticket-constants";
import { cn } from "@/lib/utils";

interface TicketTypeTabsProps {
    value: TicketTypeKey | null;
    onValueChange: (value: TicketTypeKey | null) => void;
}

export function TicketTypeTabs({ value, onValueChange }: TicketTypeTabsProps) {
    // Function to handle tab click for toggling functionality
    const handleTabClick = (type: TicketTypeKey) => {
        if (value === type) {
            onValueChange(null);
        } else {
            onValueChange(type);
        }
    };

    return (
        <Tabs value={value || ""} className="w-full flex-1">
            <TabsList className="w-full h-8 p-1 bg-muted rounded-lg">
                {(Object.keys(TICKET_TYPE_STYLES) as TicketTypeKey[]).map((type) => {
                    const style = TICKET_TYPE_STYLES[type];
                    const Icon = style.icon;
                    const isSelected = value === type;

                    return (
                        <TabsTrigger
                            key={type}
                            value={type}
                            onClick={(e) => {
                                e.preventDefault(); // Prevent default tabs behavior to handle toggle manually
                                handleTabClick(type);
                            }}
                            className={cn(
                                "flex-1 h-6 text-xs px-2 rounded-md transition-all data-[state=active]:shadow-sm",
                                isSelected ? "flex-[2]" : "flex-1" // Give slightly more space to active tab for text
                            )}
                        >
                            <Icon className={cn("h-3.5 w-3.5", isSelected ? "mr-1.5" : "")} />
                            {isSelected && <span>{style.label}</span>}
                        </TabsTrigger>
                    );
                })}
            </TabsList>
        </Tabs>
    );
}
