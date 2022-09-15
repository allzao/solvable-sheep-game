import React, { FC, MouseEventHandler, useEffect, useState } from 'react';

import './App.css';
import { GithubIcon } from './GithubIcon';
import { randomString } from './utils';

const icons = [`🎨`, `🌈`, `⚙️`, `💻`, `📚`, `🐯`, `🐤`, `🐼`, `🐏`, `🍀`];

interface MySymbol {
    id: string;
    status: number; // 0->1->2
    isCover: boolean;
    x: number;
    y: number;
    icon: string;
}

type Scene = MySymbol[];

// 8*8网格 5级别level  4*4->8*8
const makeScene: (level: number) => Scene = (level) => {
    const curLevel = Math.min(5, level);
    const iconPool = icons.slice(0, 2 * curLevel);
    const offsetPool = [0, 25, -25, 50, -50].slice(0, 1 + curLevel);

    const scene: Scene = [];

    const range = [
        [2, 6],
        [1, 6],
        [1, 7],
        [0, 7],
        [0, 8],
    ][curLevel - 1];

    const randomSet = (icon: string) => {
        const offset =
            offsetPool[Math.floor(offsetPool.length * Math.random())];
        const row =
            range[0] + Math.floor((range[1] - range[0]) * Math.random());
        const column =
            range[0] + Math.floor((range[1] - range[0]) * Math.random());
        scene.push({
            isCover: false,
            x: column * 100 + offset,
            y: row * 100 + offset,
            icon,
            id: randomString(4),
            status: 0,
        });
    };

    for (const icon of iconPool) {
        for (let i = 0; i < 6; i++) {
            randomSet(icon);
        }
    }

    return scene;
};

// 洗牌
const washScene: (level: number, scene: Scene) => Scene = (level, scene) => {
    const updateScene = scene.slice().sort(() => Math.random() - 0.5);
    const offsetPool = [0, 25, -25, 50, -50].slice(0, 1 + level);
    const range = [
        [2, 6],
        [1, 6],
        [1, 7],
        [0, 7],
        [0, 8],
    ][level - 1];

    const randomSet = (symbol: MySymbol) => {
        const offset =
            offsetPool[Math.floor(offsetPool.length * Math.random())];
        const row =
            range[0] + Math.floor((range[1] - range[0]) * Math.random());
        const column =
            range[0] + Math.floor((range[1] - range[0]) * Math.random());
        symbol.x = column * 100 + offset;
        symbol.y = row * 100 + offset;
        symbol.isCover = false;
    };

    for (const symbol of updateScene) {
        if (symbol.status !== 0) continue;
        randomSet(symbol);
    }

    return updateScene;
};

interface SymbolProps extends MySymbol {
    onClick: MouseEventHandler;
}

const Symbol: FC<SymbolProps> = ({ x, y, icon, isCover, status, onClick }) => {
    return (
        <div
            className="symbol"
            style={{
                transform: `translateX(${x}%) translateY(${y}%)`,
            }}
            onClick={onClick}
        >
            <div
                className="symbol-inner"
                style={{ backgroundColor: isCover ? 'gray' : 'white' }}
            >
                <i>{icon}</i>
            </div>
        </div>
    );
};

const App: FC = () => {
    const [scene, setScene] = useState<Scene>(makeScene(1));
    const [level, setLevel] = useState<number>(1);
    const [queue, setQueue] = useState<MySymbol[]>([]);
    const [sortedQueue, setSortedQueue] = useState<
        Record<MySymbol['id'], number>
    >({});
    const [finished, setFinished] = useState<boolean>(false);
    const [tipText, setTipText] = useState<string>('');

    // 队列区排序
    useEffect(() => {
        console.log('fuck');
        const cache: Record<string, MySymbol[]> = {};
        for (const symbol of queue) {
            if (cache[symbol.icon]) {
                cache[symbol.icon].push(symbol);
            } else {
                cache[symbol.icon] = [symbol];
            }
        }
        const temp = [];
        for (const symbols of Object.values(cache)) {
            temp.push(...symbols);
        }
        const updateSortedQueue: typeof sortedQueue = {};
        let x = 50;
        for (const symbol of temp) {
            updateSortedQueue[symbol.id] = x;
            x += 100;
        }
        setSortedQueue(updateSortedQueue);
    }, [queue]);

    const test = () => {
        const level = Math.ceil(5 * Math.random());
        setLevel(level);
        checkCover(makeScene(level));
    };

    // 初始化覆盖状态
    useEffect(() => {
        checkCover(scene);
    }, []);

    // 向后检查覆盖
    const checkCover = (scene: Scene) => {
        const updateScene = scene.slice();
        for (let i = 0; i < updateScene.length; i++) {
            // 当前item对角坐标
            const cur = updateScene[i];
            cur.isCover = false;
            if (cur.status !== 0) continue;
            const { x: x1, y: y1 } = cur;
            const x2 = x1 + 100,
                y2 = y1 + 100;

            for (let j = i + 1; j < updateScene.length; j++) {
                const compare = updateScene[j];
                if (compare.status !== 0) continue;

                // 两区域有交集视为选中
                // 两区域不重叠情况取反即为交集
                const { x, y } = compare;

                if (!(y + 100 <= y1 || y >= y2 || x + 100 <= x1 || x >= x2)) {
                    cur.isCover = true;
                    break;
                }
            }
        }
        setScene(updateScene);
    };

    // 弹出
    const pop = () => {
        if (!queue.length) return;
        const updateQueue = queue.slice();
        const symbol = updateQueue.shift();
        if (!symbol) return;
        const find = scene.find((s) => s.id === symbol.id);
        if (find) {
            setQueue(updateQueue);
            find.status = 0;
            find.x = 100 * Math.floor(8 * Math.random());
            find.y = 700;
            checkCover(scene);
        }
    };

    // 撤销
    const undo = () => {
        if (!queue.length) return;
        const updateQueue = queue.slice();
        const symbol = updateQueue.pop();
        if (!symbol) return;
        const find = scene.find((s) => s.id === symbol.id);
        if (find) {
            setQueue(updateQueue);
            find.status = 0;
            checkCover(scene);
        }
    };

    // 洗牌
    const wash = () => {
        checkCover(washScene(level, scene));
    };

    // 重开
    const restart = () => {
        setFinished(false);
        setLevel(1);
        setQueue([]);
        checkCover(makeScene(1));
    };

    // 点击item
    const clickSymbol = (idx: number) => {
        if (finished) return;
        const updateScene = scene.slice();
        const symbol = updateScene[idx];
        if (symbol.isCover || symbol.status !== 0) return;
        symbol.status++;

        let updateQueue = queue.slice();

        const filterSame = updateQueue.filter((sb) => sb.icon === symbol.icon);

        if (filterSame.length === 2) {
            // 三连了
            symbol.status++;
            updateQueue = updateQueue.filter((sb) => sb.icon !== symbol.icon);
            for (const sb of filterSame) {
                const find = updateScene.find((i) => i.id === sb.id);
                if (find) find.status++;
            }
        } else {
            updateQueue.push(symbol);
        }

        // 输了
        if (updateQueue.length === 7) {
            setTipText('失败了');
            setFinished(true);
        }

        if (!updateScene.find((s) => s.status !== 2)) {
            // 胜利
            if (level === 5) {
                setTipText('完成挑战');
                setFinished(true);
                return;
            }
            // 升级
            setLevel(level + 1);
            setQueue([]);
            checkCover(makeScene(level + 1));
        } else {
            setQueue(updateQueue);
            checkCover(updateScene);
        }
    };

    return (
        <>
            <h2>
                有解的羊了个羊(DEMO) <GithubIcon />
            </h2>
            <h3>Level: {level} </h3>

            <div className="app">
                <div className="scene-container">
                    <div className="scene-inner">
                        {scene.map((item, idx) => (
                            <Symbol
                                key={item.id}
                                {...item}
                                x={
                                    item.status === 0
                                        ? item.x
                                        : item.status === 1
                                        ? sortedQueue[item.id]
                                        : -1000
                                }
                                y={item.status === 0 ? item.y : 815}
                                onClick={() => clickSymbol(idx)}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="queue-container flex-container flex-center" />
            <div className="flex-container flex-between">
                <button className="flex-grow" onClick={pop}>
                    弹出
                </button>
                <button className="flex-grow" onClick={undo}>
                    撤销
                </button>
                <button className="flex-grow" onClick={wash}>
                    洗牌
                </button>
                {/*<button onClick={test}>测试</button>*/}
            </div>

            {finished && (
                <div className="modal">
                    <h1>{tipText}</h1>
                    <button onClick={restart}>再来一次</button>
                </div>
            )}
        </>
    );
};

export default App;