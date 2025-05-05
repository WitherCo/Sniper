import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import React from "react";
import { BotConfig } from "@/types";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";

const formSchema = z.object({
  prefix: z.string().min(1).max(5),
  ownerId: z.string().min(10).max(20),
  presence: z.enum(["online", "idle", "dnd", "invisible"]),
  status: z.string().min(1).max(100),
});

export default function Settings() {
  const { toast } = useToast();
  const [deployStatus, setDeployStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    count?: number;
  }>({ loading: false });
  
  const { data: botConfig, isLoading } = useQuery<BotConfig>({
    queryKey: ['/api/config'],
  });

  const updateConfigMutation = useMutation({
    mutationFn: (config: BotConfig) => apiRequest("POST", "/api/config", config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/config'] });
      toast({
        title: "Settings updated",
        description: "Bot configuration has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update bot configuration.",
        variant: "destructive",
      });
    },
  });
  
  const deployCommandsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/deploy-commands"),
    onSuccess: (data: any) => {
      setDeployStatus({
        loading: false,
        success: true,
        message: data.message,
        count: data.count,
      });
      toast({
        title: "Commands Deployed",
        description: `Successfully deployed ${data.count} slash commands to Discord.`,
      });
    },
    onError: (error: any) => {
      setDeployStatus({
        loading: false,
        success: false,
        message: error.message || "Failed to deploy commands to Discord.",
      });
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy commands to Discord.",
        variant: "destructive",
      });
    },
  });

  const handleDeployCommands = () => {
    setDeployStatus({ loading: true });
    deployCommandsMutation.mutate();
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prefix: botConfig?.prefix || "!",
      ownerId: botConfig?.ownerId || "",
      presence: (botConfig?.presence as any) || "online",
      status: botConfig?.status || "Helping servers",
    },
  });

  // Update form values when botConfig is loaded
  React.useEffect(() => {
    if (botConfig) {
      form.reset({
        prefix: botConfig.prefix,
        ownerId: botConfig.ownerId,
        presence: botConfig.presence as any,
        status: botConfig.status,
      });
    }
  }, [botConfig, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateConfigMutation.mutate({
      ...botConfig!,
      ...values,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="text-[#B9BBBE]">Configure your Discord bot</p>
          </div>
        </div>
        <div className="grid gap-6">
          <Card className="bg-[#36393F] border-gray-700">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#B9BBBE]">Loading bot configuration...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-[#B9BBBE]">Configure your Discord bot</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="bg-[#36393F] border-gray-700">
          <CardHeader>
            <CardTitle>Bot Configuration</CardTitle>
            <CardDescription className="text-[#B9BBBE]">
              Configure the core settings for your Discord bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="prefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Command Prefix</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="!" 
                          {...field} 
                          className="bg-[#2F3136] border-gray-700"
                        />
                      </FormControl>
                      <FormDescription className="text-[#B9BBBE]">
                        The prefix used for text commands (e.g., !help)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner ID</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your Discord User ID" 
                          {...field} 
                          className="bg-[#2F3136] border-gray-700"
                        />
                      </FormControl>
                      <FormDescription className="text-[#B9BBBE]">
                        Your Discord User ID for owner-only commands
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="presence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bot Presence</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-[#2F3136] border-gray-700">
                            <SelectValue placeholder="Select a presence status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="idle">Idle</SelectItem>
                          <SelectItem value="dnd">Do Not Disturb</SelectItem>
                          <SelectItem value="invisible">Invisible</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[#B9BBBE]">
                        The bot's presence status on Discord
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Message</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Helping servers" 
                          {...field} 
                          className="bg-[#2F3136] border-gray-700"
                        />
                      </FormControl>
                      <FormDescription className="text-[#B9BBBE]">
                        The status message shown under the bot's name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="mt-4 bg-[#5865F2]"
                  disabled={updateConfigMutation.isPending}
                >
                  {updateConfigMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-[#36393F] border-gray-700">
          <CardHeader>
            <CardTitle>Deploy Commands</CardTitle>
            <CardDescription className="text-[#B9BBBE]">
              Deploy slash commands to Discord
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-[#B9BBBE]">
                Deploy all slash commands to Discord. This will make your commands available to all servers where your bot is added.
              </p>
              
              {deployStatus.message && (
                <Alert className={deployStatus.success ? "bg-green-900/20 border-green-800" : "bg-red-900/20 border-red-800"}>
                  <AlertCircle className={deployStatus.success ? "text-green-500" : "text-red-500"} />
                  <AlertTitle className={deployStatus.success ? "text-green-500" : "text-red-500"}>
                    {deployStatus.success ? "Success" : "Error"}
                  </AlertTitle>
                  <AlertDescription className="text-gray-300">
                    {deployStatus.message}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleDeployCommands}
                  disabled={deployStatus.loading}
                  className="bg-[#5865F2] hover:bg-[#4752c4]"
                >
                  {deployStatus.loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    "Deploy Commands"
                  )}
                </Button>
                {deployStatus.success && (
                  <span className="text-sm text-green-500">
                    Deployed {deployStatus.count} commands
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#36393F] border-gray-700">
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription className="text-[#B9BBBE]">
              Configure advanced bot settings and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Command Cooldowns</h4>
                <p className="text-sm text-[#B9BBBE]">
                  Configure global cooldown settings for commands to prevent spam
                </p>
                <Input 
                  type="number" 
                  placeholder="3" 
                  className="mt-2 bg-[#2F3136] border-gray-700 w-32"
                  min="0"
                  max="60"
                />
                <p className="text-xs text-[#B9BBBE] mt-1">
                  Default cooldown in seconds
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Developer Mode</h4>
                <p className="text-sm text-[#B9BBBE]">
                  Enable developer mode for additional logging and debug features
                </p>
                <div className="flex items-center mt-2">
                  <input 
                    type="checkbox" 
                    id="devMode" 
                    className="h-4 w-4 rounded border-gray-700 focus:ring-[#5865F2]" 
                  />
                  <label htmlFor="devMode" className="ml-2 text-sm">
                    Enable Developer Mode
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="secondary" 
              className="bg-[#42464D] hover:bg-opacity-80"
            >
              Save Advanced Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
