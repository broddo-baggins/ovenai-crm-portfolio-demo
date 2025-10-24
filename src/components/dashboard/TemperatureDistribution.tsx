import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TemperatureDistributionProps {
  data?: {
    temperature: string;
    count: number;
    color: string;
  }[];
}

const mockData = [
  { temperature: 'Cold', count: 27, color: '#B0BEC5' },
  { temperature: 'Cool', count: 36, color: '#6B7280' },
  { temperature: 'Warm', count: 27, color: '#FFB74D' },
  { temperature: 'Hot', count: 18, color: '#E53935' }
];

const TemperatureDistribution = ({ data = mockData }: TemperatureDistributionProps) => {
  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="horizontal"
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 60,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis 
            type="number" 
            domain={[0, 'dataMax']}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            type="category" 
            dataKey="temperature" 
            width={50}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          <Tooltip 
            formatter={(value) => [`${value} leads`, 'Count']}
            labelFormatter={(label) => `Temperature: ${label}`}
          />
          <Bar 
            dataKey="count" 
            radius={[0, 4, 4, 0]}
            barSize={40}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TemperatureDistribution; 