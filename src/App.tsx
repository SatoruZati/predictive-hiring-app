import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarIcon, Users, TrendingUp, Briefcase, LayoutDashboard } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

// Mock Data (Replace with your actual data loading)
interface HiringDataPoint {
    date: string;
    hires: number;
}

// Generate some mock data
const generateMockData = (startDate: Date, endDate: Date, trend: 'up' | 'down' | 'stable' = 'stable'): HiringDataPoint[] => {
    const data: HiringDataPoint[] = [];
    let currentHires = 50; // Initial number of hires
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // Simulate trend
        if (trend === 'up') {
            currentHires += Math.floor(Math.random() * 5) + 1; // Increase slightly
        } else if (trend === 'down') {
            currentHires -= Math.floor(Math.random() * 5) + 1; // Decrease slightly
            if (currentHires < 0) currentHires = 0; // Ensure not negative
        } else {
            currentHires += Math.floor(Math.random() * 3) - 1;
            if (currentHires < 0) currentHires = 0;
        }

        data.push({ date: dateString, hires: currentHires });
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
    }
    return data;
};

// LSTM Model (Simplified - In a real scenario, this would involve a backend and a proper ML library)
const trainLSTMModel = (data: HiringDataPoint[], endDate: Date): HiringDataPoint[] => {
    // Very simplified "model" for demonstration.  In reality, this would:
    // 1. Preprocess data (scaling, etc.)
    // 2. Convert data to sequences
    // 3. Define an LSTM model (using TensorFlow.js, PyTorch, etc.)
    // 4. Train the model
    // 5. Make predictions
    // 6. Inverse transform the predictions

    if (!data || data.length === 0) {
        const today = new Date();
        let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const predictions: HiringDataPoint[] = [];
        while (currentDate <= endDate) {
            predictions.push({
                date: currentDate.toISOString().split('T')[0],
                hires: 0
            });
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        }
        return predictions;
    }

    const lastDate = new Date(data[data.length - 1].date);
    let lastHires = data[data.length - 1].hires;
    const predictions: HiringDataPoint[] = [];
    let currentDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);


    // Simulate a simple trend for the prediction
    const trendFactor = Math.random() * 3 - 1; // Random number between -1 and 2

    while (currentDate <= endDate) {
        const nextDateString = currentDate.toISOString().split('T')[0];
        lastHires = Math.max(0, Math.floor(lastHires + trendFactor + Math.random() * 4 - 2)); // Add some noise
        predictions.push({ date: nextDateString, hires: lastHires });
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    return predictions;
};

// Main Component
const PredictiveHiringApp = () => {
    const [historicalData, setHistoricalData] = useState<HiringDataPoint[]>([]);
    const [predictions, setPredictions] = useState<HiringDataPoint[]>([]);
    const [predictionYear, setPredictionYear] = useState<number>(new Date().getFullYear() + 1); // Default to next year
    const [trainingStartDate, setTrainingStartDate] = useState<Date | undefined>(new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1)); // Default to 1 year ago
    const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('Engineering'); // Added department filter
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Operations']; // Example departments

    // Function to (re)train the model and make predictions
    const handleTrainAndPredict = useCallback(() => {
        setLoading(true);
        const predictionEndDate = new Date(predictionYear, 11, 31); // Predict until end of the year.
        // Generate historical data based on selected start date and trend
        const newData = generateMockData(trainingStartDate || new Date(), new Date(), trend); // Use up to current date for historical
        setHistoricalData(newData);

        // Simulate training and prediction (replace with actual model call)
        setTimeout(() => {
            const newPredictions = trainLSTMModel(newData, predictionEndDate);
            setPredictions(newPredictions);
            setLoading(false);
        }, 1500); // Simulate 1.5s delay
    }, [predictionYear, trainingStartDate, trend]);

    // Initial data load (optional - you might want to load default data)
    useEffect(() => {
        handleTrainAndPredict(); // Initial training on component mount
    }, [handleTrainAndPredict]);

    const totalHires = historicalData.reduce((sum, dataPoint) => sum + dataPoint.hires, 0);
    const averageHires = historicalData.length > 0 ? (totalHires / historicalData.length).toFixed(1) : "0";

    // Dashboard Components
    const HiringTrendsChart = () => {
        // Combine historical and predictions for the chart, filtering by date.
        const chartData = [...historicalData, ...predictions].filter(item => {
            const itemDate = new Date(item.date);
            const startOfYear = new Date(Math.min(trainingStartDate?.getFullYear() || new Date().getFullYear() - 1, predictionYear), 0, 1);
            const endOfYear = new Date(predictionYear, 11, 31);
            return itemDate >= startOfYear && itemDate <= endOfYear;
        });

        return (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#94a3b8' }}
                        tickFormatter={(timeStr) => {
                            const date = new Date(timeStr);
                            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        }}
                    />
                    <YAxis tick={{ fill: '#94a3b8' }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        labelStyle={{ color: '#f8fafc' }}
                        formatter={(value: any) => value}
                        labelFormatter={(label: string) => {
                            const date = new Date(label);
                            return date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            });
                        }}
                    />
                    <Legend wrapperStyle={{ color: '#f8fafc' }} />
                    <Line
                        type="monotone"
                        dataKey="hires"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                        name="Historical Hires"
                        strokeWidth={2}
                    />
                    {predictions.length > 0 && (
                        <Line
                            type="monotone"
                            dataKey="hires"
                            stroke="#82ca9d"
                            strokeDasharray="5 5"
                            name="Predicted Hires"
                            strokeWidth={2}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        )
    };

    const KeyMetricsCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }) => (
        <Card className="bg-white/5 border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
                <Icon className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-white">{value}</div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-white">Predictive Hiring & Workforce Analytics</h1>
                    <p className="text-gray-400">Use historical data to predict future hiring needs.</p>
                </div>

                <Card className="bg-white/5 border-white/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Dashboard Controls</CardTitle>
                        <CardDescription className="text-gray-400">Configure the model and view predictions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Department Filter */}
                            <div>
                                <Label htmlFor="department" className="text-gray-300 block mb-2">Department</Label>
                                <Select onValueChange={setSelectedDepartment} value={selectedDepartment}>
                                    <SelectTrigger className="w-full bg-black/20 border-gray-700 text-white">
                                        <SelectValue placeholder="Select a department" className="text-gray-300" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                        {departments.map(dept => (
                                            <SelectItem key={dept} value={dept} className="hover:bg-gray-700/50 text-white">
                                                {dept}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Prediction Year */}
                            <div>
                                <Label htmlFor="prediction-year" className="text-gray-300 block mb-2">Prediction Year</Label>
                                <Input
                                    id="prediction-year"
                                    type="number"
                                    value={predictionYear}
                                    onChange={(e) => setPredictionYear(parseInt(e.target.value, 10))}
                                    className="bg-black/20 border-gray-700 text-white"
                                    min={new Date().getFullYear()}
                                />
                            </div>

                            {/* Training Start Date */}
                            <div>
                                <Label htmlFor="training-start-date" className="text-gray-300 block mb-2">Training Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full bg-black/20 border-gray-700 text-white justify-start text-left font-normal",
                                                !trainingStartDate && "text-gray-400"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                                            {trainingStartDate ? (
                                                format(trainingStartDate, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={trainingStartDate}
                                            onSelect={setTrainingStartDate}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date('2020-01-01')
                                            }
                                            initialFocus
                                            className="rounded-md border-0 text-white"
                                            style={{
                                                "--calendar-background": "#334155",
                                                "--calendar-foreground": "#f8fafc",
                                                "--calendar-day-selected": "#6d28d9",
                                                "--calendar-day-hovered": "#4b5563",
                                                "--calendar-day-disabled": "#6b7280",
                                                "--calendar-nav-button": "#f8fafc",
                                                "--calendar-nav-title": "#f8fafc",
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Trend Selection */}
                            <div>
                                <Label htmlFor="trend" className="text-gray-300 block mb-2">Hiring Trend</Label>
                                <Select onValueChange={(value) => setTrend(value as 'up' | 'down' | 'stable')} value={trend}>
                                    <SelectTrigger className="w-full bg-black/20 border-gray-700 text-white">
                                        <SelectValue placeholder="Select trend" className="text-gray-300" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                        <SelectItem value="up" className="hover:bg-gray-700/50 text-white">Upward</SelectItem>
                                        <SelectItem value="down" className="hover:bg-gray-700/50 text-white">Downward</SelectItem>
                                        <SelectItem value="stable" className="hover:bg-gray-700/50 text-white">Stable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button
                            onClick={handleTrainAndPredict}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600
                                       transition-all duration-300 py-3 text-lg font-semibold shadow-lg hover:shadow-xl"
                        >
                            {loading ? 'Training Model...' : 'Train Model & Predict'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KeyMetricsCard title="Total Hires" value={totalHires.toString()} icon={Users} />
                    <KeyMetricsCard title="Avg. Hires/Month" value={averageHires} icon={TrendingUp} />
                    <KeyMetricsCard title={`Predicted Hires (${predictionYear})`} value={predictions.reduce((sum, p) => sum + p.hires, 0).toString()} icon={Briefcase} />
                </div>

                {/* Hiring Trends Chart */}
                <Card className="bg-white/5 border-white/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-white">Hiring Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div>Loading chart...</div> : <HiringTrendsChart />}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PredictiveHiringApp;
