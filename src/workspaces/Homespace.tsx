"use client";

import type React from "react";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  fetchWikipediaData,
  type SearchResult,
} from "@/app/actions/fetchWikipedia";
import SearchBar from "../../packages/components/SearchBar";
import {
  Book,
  Bookmark,
  Map,
  PlusCircle,
  Search,
  Clock,
  Share2,
  ExternalLink,
  BookOpen,
  Eye,
  MapPin,
  Tag,
  TrendingUp,
  Globe,
  Calendar,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotebookDropdown } from "../../packages/components/notebook-dropdown";

interface HomespaceProps {
  onCreateNotebook?: (name: string, description: string) => void;
  onViewFullArticle?: (title: string) => void;
  onBookmarkArticle?: (article: SearchResult) => void;
  onToggleDotMaps?: () => void;
  onSelectNotebook?: (notebook: any) => void;
}

const Homespace = ({
  onCreateNotebook,
  onViewFullArticle,
  onBookmarkArticle,
  onToggleDotMaps,
  onSelectNotebook,
}: HomespaceProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const title = searchParams.get("search") || "";
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const MAX_MAIN_SUMMARY_LENGTH = 200;

  // Dialog states
  const [notebookDialogOpen, setNotebookDialogOpen] = useState(false);
  const [notebookName, setNotebookName] = useState("");
  const [description, setDescription] = useState("");
  const [showDotMapsDialog, setShowDotMapsDialog] = useState(false);
  const [showDisambiguationDialog, setShowDisambiguationDialog] =
    useState(false);

  // Extract and save search history to local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Update search history when a new search is made
  useEffect(() => {
    if (title && !searchHistory.includes(title)) {
      const updatedHistory = [title, ...searchHistory].slice(0, 5);
      setSearchHistory(updatedHistory);
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
    }
  }, [title, searchHistory]);

  // Fetch Wikipedia data when title changes
  useEffect(() => {
    if (!title) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const getData = async () => {
      setLoading(true);
      try {
        const data = await fetchWikipediaData(title);
        if (!signal.aborted) {
          setSearchResult(data);
          // Show disambiguation dialog if needed
          if (
            data.isDisambiguation &&
            data.disambiguationOptions &&
            data.disambiguationOptions.length > 0
          ) {
            setShowDisambiguationDialog(true);
          }
        }
      } catch (error) {
        console.error("Error fetching Wikipedia data:", error);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    getData();

    return () => {
      controller.abort();
    };
  }, [title]);

  // Handle search action
  const onSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      router.push(`/homespace?search=${encodeURIComponent(query)}`);
    },
    [router]
  );

  // Handle notebook creation
  const handleSubmitNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notebookName.trim()) return;

    if (onCreateNotebook) {
      await onCreateNotebook(notebookName, description);
    }

    setNotebookName("");
    setDescription("");
    setNotebookDialogOpen(false);

    // Trigger a refresh of the notebooks list
    window.dispatchEvent(new CustomEvent("refreshNotebooks"));
  };

  // Handle opening DotMaps
  const handleOpenDotMaps = useCallback(() => {
    if (onToggleDotMaps) {
      onToggleDotMaps();
    } else {
      router.push("/dotmaps");
    }
  }, [onToggleDotMaps, router]);

  // Render text with links
  const parseTextWithLinks = useCallback((text: string) => {
    if (!text) return "";

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    const urls = text.match(urlRegex) || [];

    return parts.map((part, i) =>
      urls.includes(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {part}
        </a>
      ) : (
        part
      )
    );
  }, []);

  // Handle full article view
  const handleReadFullArticle = useCallback(() => {
    if (searchResult && onViewFullArticle) {
      setLoading(true);
      setTimeout(() => {
        onViewFullArticle(searchResult.title);
        setLoading(false);
      }, 100);
    }
  }, [searchResult, onViewFullArticle]);

  // Handle bookmarking
  const handleBookmark = useCallback(() => {
    if (searchResult && onBookmarkArticle) {
      onBookmarkArticle(searchResult);
    }
  }, [searchResult, onBookmarkArticle]);

  // Format article reading time
  const formattedReadingTime = useMemo(() => {
    if (!searchResult?.readingTime) return "< 1 min read";
    return `${searchResult.readingTime} min read`;
  }, [searchResult?.readingTime]);

  // Truncate main summary
  const truncatedSummary = useMemo(() => {
    if (!searchResult?.summary) return "";
    if (searchResult.summary.length > MAX_MAIN_SUMMARY_LENGTH) {
      return searchResult.summary.substring(0, MAX_MAIN_SUMMARY_LENGTH) + "...";
    }
    return searchResult.summary;
  }, [searchResult?.summary]);

  // Format page views
  const formatPageViews = useCallback((views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  }, []);

  // Add to DotMap dialog
  const handleAddToDotMap = useCallback(() => {
    if (!searchResult) return;

    // Get existing maps
    const savedMaps = localStorage.getItem("dotmaps-list");
    const maps = savedMaps ? JSON.parse(savedMaps) : ["default"];

    // Add the current article to the default map
    const mapId = "default";
    const savedMap = localStorage.getItem(`dotmap-${mapId}`);
    const mapData = savedMap ? JSON.parse(savedMap) : { nodes: [], edges: [] };

    // Create a new node for this article
    const newNode = {
      id: `node-${Date.now()}`,
      type: "custom",
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: {
        title: searchResult.title,
        content: searchResult.summary?.substring(0, 100) + "...",
        type: "article",
        coordinates: searchResult.coordinates,
        pageViews: searchResult.pageViews,
        tags: searchResult.tags,
      },
    };

    // Add the node to the map
    mapData.nodes.push(newNode);

    // Save the updated map
    localStorage.setItem(`dotmap-${mapId}`, JSON.stringify(mapData));

    // Show confirmation
    setShowDotMapsDialog(true);
  }, [searchResult]);

  // Handle disambiguation selection
  const handleDisambiguationSelect = useCallback(
    (option: any) => {
      setShowDisambiguationDialog(false);
      onSearch(option.title);
    },
    [onSearch]
  );

  // Handle share
  const handleShare = useCallback(async () => {
    if (!searchResult) return;

    const shareData = {
      title: searchResult.title,
      text: searchResult.summary?.substring(0, 100) + "...",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  }, [searchResult]);

  // Render article metadata section
  const renderArticleMetadata = () => {
    if (!searchResult) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Article Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {searchResult.pageViews && (
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-medium">
                  {formatPageViews(searchResult.pageViews.daily)}/day
                </div>
                <div className="text-xs text-gray-500">Page Views</div>
              </div>
            </div>
          )}

          {searchResult.lastModified && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium">
                  {new Date(searchResult.lastModified).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500">Last Updated</div>
              </div>
            </div>
          )}

          {searchResult.coordinates && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-red-600" />
              <div>
                <div className="font-medium">
                  {searchResult.coordinates.lat.toFixed(2)},{" "}
                  {searchResult.coordinates.lon.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">Coordinates</div>
              </div>
            </div>
          )}

          {searchResult.language && (
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-purple-600" />
              <div>
                <div className="font-medium">
                  {searchResult.language.toUpperCase()}
                </div>
                <div className="text-xs text-gray-500">Language</div>
              </div>
            </div>
          )}
        </div>

        {/* Alternative titles */}
        {searchResult.alternativeTitles &&
          searchResult.alternativeTitles.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-gray-600 mb-2">
                Also known as:
              </div>
              <div className="flex flex-wrap gap-1">
                {searchResult.alternativeTitles
                  .slice(0, 3)
                  .map((altTitle, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {altTitle}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
      </div>
    );
  };

  // Render tags section
  const renderTagsSection = () => {
    if (!searchResult?.tags || searchResult.tags.length === 0) return null;

    const categorizedTags = {
      category: searchResult.tags.filter((tag) => tag.type === "category"),
      portal: searchResult.tags.filter((tag) => tag.type === "portal"),
      project: searchResult.tags.filter((tag) => tag.type === "project"),
      template: searchResult.tags.filter((tag) => tag.type === "template"),
    };

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Tag className="h-5 w-5 mr-2 text-gray-600" />
          Tags & Categories
        </h3>
        <Tabs defaultValue="category" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="category">
              Categories ({categorizedTags.category.length})
            </TabsTrigger>
            <TabsTrigger value="portal">
              Portals ({categorizedTags.portal.length})
            </TabsTrigger>
            <TabsTrigger value="project">
              Projects ({categorizedTags.project.length})
            </TabsTrigger>
            <TabsTrigger value="template">
              Templates ({categorizedTags.template.length})
            </TabsTrigger>
          </TabsList>

          {Object.entries(categorizedTags).map(([type, tags]) => (
            <TabsContent key={type} value={type} className="mt-3">
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className={`cursor-pointer transition-colors ${
                        type === "category"
                          ? "hover:bg-blue-100"
                          : type === "portal"
                          ? "hover:bg-green-100"
                          : type === "project"
                          ? "hover:bg-purple-100"
                          : "hover:bg-orange-100"
                      }`}
                      onClick={() =>
                        tag.url
                          ? window.open(tag.url, "_blank")
                          : onSearch(tag.name)
                      }
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No {type}s available</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  };

  // Render article content
  const renderArticleContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex space-x-4">
            <Skeleton className="h-40 w-40 flex-shrink-0" />
            <div className="space-y-2 flex-grow">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      );
    }

    if (!searchResult) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Search className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-xl text-gray-500">
            Search for a topic to start exploring
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Try searching for topics like "Quantum Physics" or "Ancient Rome"
          </p>
        </div>
      );
    }

    return (
      <div className="h-full">
        {/* Header with title and actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold">{searchResult.title}</h1>
            {!searchResult.isExactMatch && (
              <Badge variant="secondary" className="text-xs">
                <Info className="h-3 w-3 mr-1" />
                Best Match
              </Badge>
            )}
            {searchResult.searchScore && searchResult.searchScore < 0.8 && (
              <Badge variant="outline" className="text-xs">
                Score: {Math.round(searchResult.searchScore * 100)}%
              </Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBookmark}
                    className="hover:bg-yellow-100"
                  >
                    <Bookmark className="h-5 w-5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bookmark this article</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAddToDotMap}
                    className="hover:bg-green-100"
                  >
                    <Map className="h-5 w-5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add to DotMap</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(searchResult.url, "_blank")}
                    className="hover:bg-blue-100"
                  >
                    <ExternalLink className="h-5 w-5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View on Wikipedia</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="hover:bg-green-100"
                  >
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share this article</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Disambiguation alert */}
        {searchResult.isDisambiguation && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This is a disambiguation page. Multiple articles match your
              search.{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-medium"
                onClick={() => setShowDisambiguationDialog(true)}
              >
                Choose specific article
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main categories as badges */}
        {searchResult.categories && searchResult.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {searchResult.categories.slice(0, 5).map((category, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="bg-gray-100 hover:bg-gray-200 cursor-pointer"
                onClick={() => onSearch(category)}
              >
                {category}
              </Badge>
            ))}
            {searchResult.categories.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{searchResult.categories.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Article metadata */}
        {renderArticleMetadata()}

        {/* Article content */}
        <div className="article-content">
          {searchResult.mediaUrl && (
            <div className="float-right ml-6 mb-4">
              <figure className="max-w-xs">
                <img
                  src={searchResult.mediaUrl || "/placeholder.svg"}
                  alt={searchResult.title}
                  className="w-full max-h-60 rounded-md border border-gray-200 shadow-sm"
                />
                {searchResult.mediaCaption && (
                  <figcaption className="text-xs text-gray-500 mt-1 text-center">
                    {searchResult.mediaCaption}
                  </figcaption>
                )}
              </figure>
            </div>
          )}

          <div className="text-gray-600 leading-relaxed mb-6">
            {parseTextWithLinks(truncatedSummary)}
          </div>

          <div className="flex gap-3 mb-6">
            <Button
              onClick={handleReadFullArticle}
              className="px-4 py-2 bg-[#fff9cf] text-black hover:bg-[#ffef9e] shadow-sm transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="mr-2">Loading...</span>
                  <span className="animate-spin">⟳</span>
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read Full Article ({formattedReadingTime})
                </>
              )}
            </Button>

            {searchResult.coordinates && (
              <Button
                variant="outline"
                className="px-4 py-2 shadow-sm transition-colors"
                onClick={() => {
                  const { lat, lon } = searchResult.coordinates!;
                  window.open(
                    `https://www.google.com/maps?q=${lat},${lon}`,
                    "_blank"
                  );
                }}
              >
                <MapPin className="mr-2 h-4 w-4" />
                View Location
              </Button>
            )}
          </div>
        </div>

        {/* Tags section */}
        {renderTagsSection()}
      </div>
    );
  };

  // Enhanced related topics section with better categorization
  const renderRelatedTopics = () => {
    if (!searchResult || searchResult.relatedArticles.length === 0) {
      return (
        <div className="text-center text-gray-500 py-6">
          <p>Related topics will appear here when available</p>
        </div>
      );
    }

    return (
      <>
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
          Related Topics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {searchResult.relatedArticles.map((article, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium">
                  <button
                    onClick={() => onSearch(article.title)}
                    className="text-left text-indigo-600 hover:text-indigo-800 hover:underline w-full"
                  >
                    {article.title}
                  </button>
                </CardTitle>
                {article.reason && (
                  <Badge variant="secondary" className="text-xs w-fit">
                    {article.reason}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {article.summary}
                </p>
                {article.score && (
                  <div className="flex items-center text-xs text-gray-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Relevance: {Math.round(article.score * 100)}%
                  </div>
                )}
              </CardContent>
              {article.thumbnail && (
                <div className="px-6 pb-4">
                  <img
                    src={article.thumbnail || "/placeholder.svg"}
                    alt={article.title}
                    className="w-full h-24 object-cover rounded-md"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      </>
    );
  };

  // Enhanced sidebar with statistics
  const renderEnhancedSidebar = () => {
    return (
      <div className="bg-[#F9F9F9] p-6 h-full rounded-lg shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-2">
            <Search className="w-4 h-4 mr-2 text-gray-600" />
            Research On It
          </h2>
          <div className="border-b border-gray-200 mb-4"></div>
        </div>

        {/* Article Stats */}
        {searchResult && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 flex items-center mb-3">
              <TrendingUp className="w-4 h-4 mr-2 text-gray-600" />
              Article Stats
            </h3>
            <div className="space-y-2 text-sm">
              {searchResult.pageViews && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Views:</span>
                  <span className="font-medium">
                    {formatPageViews(searchResult.pageViews.daily)}
                  </span>
                </div>
              )}
              {searchResult.readingTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reading Time:</span>
                  <span className="font-medium">{formattedReadingTime}</span>
                </div>
              )}
              {searchResult.categories && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Categories:</span>
                  <span className="font-medium">
                    {searchResult.categories.length}
                  </span>
                </div>
              )}
              {searchResult.relatedArticles && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Related Articles:</span>
                  <span className="font-medium">
                    {searchResult.relatedArticles.length}
                  </span>
                </div>
              )}
            </div>
            <div className="border-b border-gray-200 my-4"></div>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium text-gray-700 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-600" />
                Recent Searches
              </h3>
            </div>
            <ul className="space-y-2 text-sm">
              {searchHistory.map((item, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => onSearch(item)}
                    className="text-indigo-600 hover:text-indigo-800 hover:underline text-left w-full truncate"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-b border-gray-200 my-4"></div>
          </div>
        )}

        {/* Notebooks */}
        <Dialog open={notebookDialogOpen} onOpenChange={setNotebookDialogOpen}>
          <NotebookDropdown
            onCreateNotebook={() => setNotebookDialogOpen(true)}
            onSelectNotebook={(notebook) => {
              if (onSelectNotebook) {
                onSelectNotebook(notebook);
              }
            }}
          />

          <DialogContent className="sm:max-w-[425px] p-6">
            <DialogHeader className="text-center mb-4">
              <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
                <Book className="h-6 w-6" />
                Create a new Notebook
              </DialogTitle>
              <DialogDescription className="text-center mt-2">
                Fill in the details below to create your new notebook.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitNotebook} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notebook-name">Notebook Name</Label>
                <Input
                  id="notebook-name"
                  placeholder="My Research Notes"
                  value={notebookName}
                  onChange={(e) => setNotebookName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Notes for my research project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNotebookDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Notebook</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DotMaps */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-medium text-gray-700 flex items-center">
              <Map className="w-4 h-4 mr-2 text-gray-600" />
              DotMaps
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleAddToDotMap}
            >
              <PlusCircle className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Visual maps of connected knowledge
          </p>
          <Button
            variant="default"
            size="sm"
            className="w-full mt-2"
            onClick={handleOpenDotMaps}
          >
            <Map className="mr-2 h-4 w-4" />
            {onToggleDotMaps ? "Show DotMaps Panel" : "Open DotMaps"}
          </Button>
          <div className="border-b border-gray-200 my-4"></div>
        </div>

        {/* Bookmarks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-medium text-gray-700 flex items-center">
              <Bookmark className="w-4 h-4 mr-2 text-gray-600" />
              Bookmarks
            </h3>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={handleBookmark}
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Save articles for later reference
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto bg-[#EEEEEE] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <SearchBar onSearch={onSearch} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
          {/* Article Section */}
          <div className="md:col-span-3 h-full">
            <div className="bg-[#F9F9F9] p-6 h-full rounded-lg shadow-sm">
              {renderArticleContent()}
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1 h-full">{renderEnhancedSidebar()}</div>
        </div>

        {/* Related Topics Section */}
        <div className="mt-6">
          <div className="bg-[#F9F9F9] p-6 rounded-lg shadow-sm">
            {renderRelatedTopics()}
          </div>
        </div>
      </div>

      {/* Add to DotMap Dialog */}
      <Dialog open={showDotMapsDialog} onOpenChange={setShowDotMapsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Added to DotMap</DialogTitle>
            <DialogDescription>
              The article has been added to your DotMap.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDotMapsDialog(false)}
            >
              Close
            </Button>
            <Button onClick={handleOpenDotMaps}>
              <Map className="mr-2 h-4 w-4" />
              Open DotMap
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disambiguation Dialog */}
      <Dialog
        open={showDisambiguationDialog}
        onOpenChange={setShowDisambiguationDialog}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Choose Article</DialogTitle>
            <DialogDescription>
              Multiple articles match your search. Please select the one you're
              looking for:
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {searchResult?.disambiguationOptions?.map((option, idx) => (
              <Card
                key={idx}
                className="mb-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleDisambiguationSelect(option)}
              >
                <CardContent className="p-4">
                  <h4 className="font-medium text-blue-600 hover:text-blue-800">
                    {option.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisambiguationDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Homespace;
