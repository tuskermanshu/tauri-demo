import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Table,
  Input,
  Button,
  Space,
  Breadcrumb,
  Typography,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  FolderOutlined,
  FileOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
  SearchOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs from 'dayjs';

import {invoke} from "@tauri-apps/api/core"

const { Header, Content } = Layout;
const { Text } = Typography;

interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  createTime: Date;
  updateTime: Date;
}

const FileBrowser: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<(boolean | null)[]>([]);

  // 加载文件列表
  const loadFiles = async (path: string) => {
    try {
      setLoading(true);
      const fileList = await window.fileApi.getFiles(path);
      console.log("filesList",fileList)
      setFiles(fileList);
      if (!pathHistory.includes(path)) {
        setPathHistory([...pathHistory, path]);
      }
      setCurrentPath(path);
    } catch (error) {
      message.error('Failed to load files');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

 async function getTauriFn(){
    const result = await invoke('greet',{name:'tauri'})
    console.log("result",result)
    
  }

  useEffect(()=>{
    loadFiles("")
    getTauriFn()
  },[])

  // 格式化文件大小
  const formatFileSize = (size: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let index = 0;
    let fileSize = size;

    while (fileSize >= 1024 && index < units.length - 1) {
      fileSize /= 1024;
      index++;
    }

    return `${fileSize.toFixed(2)} ${units[index]}`;
  };

  const columns: ColumnsType<FileInfo> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: FileInfo) => (
        <Space>
          {record.isDirectory ? (
            <FolderOutlined style={{ color: '#ffd700' }} />
          ) : (
            <FileOutlined style={{ color: '#87cefa' }} />
          )}
          <Text
            className={record.isDirectory ? 'cursor-pointer hover:text-blue-500' : ''}
            onClick={() => {
              if (record.isDirectory) {
                // 使用原始路径，不需要转换
                loadFiles(record.path);
              }
            }}
          >
            {text}
          </Text>
        </Space>
      ),
      filteredValue: [searchText],
      onFilter: (value, record) =>{
        return record.name.toLowerCase().includes(value.toString().toLowerCase())
      },
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => !isNaN(size) ? formatFileSize(size) : '-',
      sorter: (a, b) => a.size - b.size,
    },
    {
      title: 'Type',
      key: 'type',
      render: (_, record) => (
        <Tag color={record.isDirectory ? 'gold' : 'blue'}>
          {record.isDirectory ? 'Folder' : 'File'}
        </Tag>
      ),
      filters: [
        { text: 'Folder', value: true },
        { text: 'File', value: false },
      ],
      filteredValue: selectedTypeFilters as any,
      onFilter: (value, record) => record.isDirectory === value,
    },
    {
      title: 'Last Modified',
      dataIndex: 'updateTime',
      key: 'updateTime',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) =>
        dayjs(a.updateTime).unix() - dayjs(b.updateTime).unix(),
    },
  ];

  // 处理路径导航点击
  const handleBreadcrumbClick = (path: string) => {
    loadFiles(path);
  };

  // 生成面包屑导航项
  const generateBreadcrumbItems = () => {

    const paths = currentPath.split(/[/\\]/).filter(Boolean);
    let fullPath = '/';
    return [
      ...paths.map((part) => {
        fullPath = fullPath ? `${fullPath}\\${part}` : part;
        return {
          title: part,
          path: fullPath,
        };
      }),
    ];
  };

  // 向上返回按钮的处理函数
  const handleGoUp = () => {
    let parts = currentPath.split('\\');
    let upPath = ''

    if(parts.length > 1){
      parts.pop();
      upPath = parts.join('\\');
    }else{
       upPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    }

    loadFiles(upPath);
  };

// 获取文件目录
const handleSelectFilePath = async() => {

  try {
    const selectedPath = await window.fileApi.selectFolder();
    if (selectedPath) {
      loadFiles(selectedPath);
    }
  } catch (error) {
    message.error('Failed to select folder');
    console.error(error);
  }
}

const handleTableChange: TableProps<FileInfo>['onChange'] = (
  pagination,
  filters,
  sorter
) => {
  setSelectedTypeFilters(filters.type as (boolean | null)[]);
};

  return (
    <Layout className="min-h-screen bg-white w-full h-full">
      <Header className="bg-white p-4 ">
        <div className="flex items-center justify-between">
          <Text className="text-xl font-bold">File Browser</Text>
          <Space>
            <Input
              placeholder="Search files..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64"
            />
             <Tooltip title="Select file">
              <Button
                icon={<FileSearchOutlined />}
                onClick={() => {
                  handleSelectFilePath()
                }}
              />
            </Tooltip>
            <Tooltip title="Go up">
              <Button
                icon={<ArrowUpOutlined />}
                onClick={() => {
                  handleGoUp()
                }}
                disabled={!currentPath || currentPath === '/'}
              />
            </Tooltip>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadFiles(currentPath)}
              />
            </Tooltip>
          </Space>
        </div>
      </Header>

      <Content className="p-6">
        <Card>
          <Breadcrumb className="mb-4">
            {generateBreadcrumbItems().map((item, index) => (
              <Breadcrumb.Item key={index}>
                <Text
                  className="cursor-pointer hover:text-blue-500"
                  onClick={() => handleBreadcrumbClick(item.path)}
                >
                  {item.title}
                </Text>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>

          <Table
            columns={columns}
            dataSource={files}
            loading={loading}
            onChange={handleTableChange}
            rowKey="path"
            pagination={{
              defaultPageSize: 5,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`,
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default FileBrowser;