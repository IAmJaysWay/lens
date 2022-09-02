import styles from "../styles/Home.module.css";
import { client, Profile } from "./api/lensCalls";
import { Tabs, Button } from "antd";
import Moralis from "moralis";
import { useConnect, useAccount, useDisconnect, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import abi from "../abi.json";


const { TabPane } = Tabs;

export default function Home({ profile, nftArray, myNFT }) {
  /* console.log(profile);
  console.log(nftArray); 
  console.log(myNFT);*/

  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { isConnected } = useAccount();
  const {config} = usePrepareContractWrite(
    {
      addressOrName: '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d',
      contractInterface: abi,
      functionName: 'follow',
      args: [[profile.id], [0x0]]
    }
  )

  const { write } = useContractWrite(config);


  async function follow(){

    if(isConnected){
      await disconnectAsync();
    }
    await connectAsync({
      connector: new MetaMaskConnector({}),
    });


    write();

  }



  return (
    <div className={styles.container}>
      <img
        className={styles.banner}
        src={profile.coverPicture.original.url}
        alt="cover"
      />
      <div className={styles.profile}>
        <div className={styles.profileLeft}>
          <img
            className={styles.profileImg}
            src={profile.picture.original.url}
            alt="profileImg"
          />
          <div className={styles.info}>
            <div className={styles.name}>{profile.name}</div>
            <div className={styles.handle}>{profile.handle}</div>
            <div className={styles.bio}>{profile.bio}</div>
            <div className={styles.follow}>
              <div>Followers</div>
              <div>{profile.stats.totalFollowers}</div>
            </div>
            <div className={styles.follow}>
              <div>Following</div>
              <div>{profile.stats.totalFollowing}</div>
            </div>
          </div>
        </div>
        <div className={styles.profileRight}>
          <Tabs defaultActiveKey="1" centered>
            <TabPane tab="I'm Following" key="1">
            <div className={styles.followingNFTs}>
              {nftArray?.map((e) => {
                return (
                  <iframe
                    className={styles.animation}
                    src={e}
                  ></iframe>
                );
              })}
              </div>
            </TabPane>
            <TabPane tab="Follow Me" key="2">
              <div className={styles.followMe}>
                <div>
                <div className={styles.promptOne}>
                  Hey There 👋🏼
                </div>
                <div className={styles.promptTwo}>
                  Give me a follow and receive this cool NFT!
                </div>
                <Button onClick={follow} type="primary">Follow Me</Button>
                </div>
                <iframe className={styles.myNFT} src={myNFT}></iframe>
              </div>
            </TabPane>
            <TabPane tab="Social Posts" key="3" disabled={true} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const response = await client.query(Profile).toPromise();

  await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });

  const balances = await Moralis.EvmApi.account.getNFTs({
    address: response?.data.profile.ownedBy,
    chain: 0x89,
  });


  let nftArray = [];
  let nfts = balances?.data.result;

  for (let i = 0; i < nfts.length; i++) {
    if (nfts[i].metadata !== null) {
      if (
        "animation_url" in JSON.parse(nfts[i].metadata) &&
        JSON.parse(nfts[i].metadata).animation_url !== null &&
        JSON.parse(nfts[i].metadata).animation_url.includes(".lens") 
      ) {
        nftArray.push(JSON.parse(nfts[i].metadata).animation_url);
      }
    }
  }


  
  const followNFT = await Moralis.EvmApi.token.getTokenIdMetadata({
    address: response?.data.profile.followNftAddress,
    chain: 0x89,
    tokenId: 1,
  }); 

  const myNFT = JSON.parse(followNFT.data.metadata).animation_url;


  return {
    props: { profile: response?.data.profile, nftArray: nftArray, myNFT: myNFT },
  };
}
