// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventNFTV2 is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    struct EventData {
        string eventCode;
        string eventName;
        string location;
        uint256 timestamp;
        string hostName;
        uint256 attendeeCount;
        bool isActive;
        address creator;
    }
    
    // Mapping from token ID to event data
    mapping(uint256 => EventData) public eventData;
    
    // Mapping from event code to token ID (fixed to handle token ID 0)
    mapping(string => uint256) public eventCodeToTokenId;
    
    // Mapping to track if an address has minted for a specific event
    mapping(string => mapping(address => bool)) public hasMinted;
    
    // Mapping to track if an event code exists (separate from token ID check)
    mapping(string => bool) public eventExists;
    
    // Minting fee (can be set to 0 for free minting)
    uint256 public mintingFee = 0;
    
    // Event creation fee (can be set to 0 for free event creation)
    uint256 public eventCreationFee = 0;
    
    event EventNFTMinted(
        uint256 indexed tokenId, 
        address indexed minter, 
        string eventCode,
        string ipfsHash
    );
    
    event EventRegistered(
        uint256 indexed tokenId,
        string eventCode,
        string eventName,
        address indexed creator
    );

    constructor(address initialOwner) 
        ERC721("EthSafari Event NFTs V2", "ESAFARI2") 
        Ownable(initialOwner) 
    {}

    /**
     * @dev Register a new event (now public, anyone can create events)
     */
    function registerEvent(
        string memory _eventCode,
        string memory _eventName,
        string memory _location,
        uint256 _timestamp,
        string memory _hostName,
        uint256 _attendeeCount,
        string memory _ipfsHash
    ) public payable returns (uint256) {
        require(msg.value >= eventCreationFee, "Insufficient payment for event creation");
        require(bytes(_eventCode).length > 0, "Event code cannot be empty");
        require(!eventExists[_eventCode], "Event already registered");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Mint the base NFT to the event creator
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _ipfsHash);
        
        // Store event data
        eventData[tokenId] = EventData({
            eventCode: _eventCode,
            eventName: _eventName,
            location: _location,
            timestamp: _timestamp,
            hostName: _hostName,
            attendeeCount: _attendeeCount,
            isActive: true,
            creator: msg.sender
        });
        
        // Set both mappings
        eventCodeToTokenId[_eventCode] = tokenId;
        eventExists[_eventCode] = true;
        
        // Add to arrays for enumeration
        allEventCodes.push(_eventCode);
        creatorEvents[msg.sender].push(_eventCode);
        
        emit EventRegistered(tokenId, _eventCode, _eventName, msg.sender);
        return tokenId;
    }

    /**
     * @dev Mint an event attendance NFT
     */
    function mintEventNFT(
        string memory _eventCode,
        string memory _ipfsHash
    ) public payable returns (uint256) {
        require(msg.value >= mintingFee, "Insufficient payment");
        require(bytes(_eventCode).length > 0, "Invalid event code");
        require(!hasMinted[_eventCode][msg.sender], "Already minted for this event");
        require(eventExists[_eventCode], "Event not registered");
        
        uint256 baseTokenId = eventCodeToTokenId[_eventCode];
        require(eventData[baseTokenId].isActive, "Event is not active");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Mint NFT to the caller
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _ipfsHash);
        
        // Copy event data for the new token
        EventData memory baseEvent = eventData[baseTokenId];
        eventData[tokenId] = EventData({
            eventCode: baseEvent.eventCode,
            eventName: baseEvent.eventName,
            location: baseEvent.location,
            timestamp: baseEvent.timestamp,
            hostName: baseEvent.hostName,
            attendeeCount: baseEvent.attendeeCount,
            isActive: true,
            creator: baseEvent.creator
        });
        
        // Mark as minted
        hasMinted[_eventCode][msg.sender] = true;
        
        emit EventNFTMinted(tokenId, msg.sender, _eventCode, _ipfsHash);
        return tokenId;
    }

    /**
     * @dev Get event data by token ID
     */
    function getEventData(uint256 tokenId) public view returns (EventData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return eventData[tokenId];
    }

    /**
     * @dev Get token ID by event code
     */
    function getTokenIdByEventCode(string memory _eventCode) public view returns (uint256) {
        require(eventExists[_eventCode], "Event not registered");
        return eventCodeToTokenId[_eventCode];
    }

    /**
     * @dev Check if address has minted for event
     */
    function hasUserMinted(string memory _eventCode, address user) public view returns (bool) {
        return hasMinted[_eventCode][user];
    }

    /**
     * @dev Check if event exists
     */
    function eventCodeExists(string memory _eventCode) public view returns (bool) {
        return eventExists[_eventCode];
    }

    /**
     * @dev Set minting fee (only owner)
     */
    function setMintingFee(uint256 _fee) public onlyOwner {
        mintingFee = _fee;
    }

    /**
     * @dev Set event creation fee (only owner)
     */
    function setEventCreationFee(uint256 _fee) public onlyOwner {
        eventCreationFee = _fee;
    }

    /**
     * @dev Toggle event active status (only owner or event creator)
     */
    function toggleEventStatus(string memory _eventCode) public {
        require(eventExists[_eventCode], "Event not found");
        uint256 tokenId = eventCodeToTokenId[_eventCode];
        
        // Allow owner or event creator to toggle
        require(msg.sender == owner() || msg.sender == eventData[tokenId].creator, 
                "Only owner or event creator can toggle status");
        
        eventData[tokenId].isActive = !eventData[tokenId].isActive;
    }

    /**
     * @dev Update event data (only event creator)
     */
    function updateEventData(
        string memory _eventCode,
        string memory _eventName,
        string memory _location,
        uint256 _timestamp,
        string memory _hostName,
        uint256 _attendeeCount
    ) public {
        require(eventExists[_eventCode], "Event not found");
        uint256 tokenId = eventCodeToTokenId[_eventCode];
        require(msg.sender == eventData[tokenId].creator, "Only event creator can update");
        
        eventData[tokenId] = EventData({
            eventCode: _eventCode,
            eventName: _eventName,
            location: _location,
            timestamp: _timestamp,
            hostName: _hostName,
            attendeeCount: _attendeeCount,
            isActive: eventData[tokenId].isActive,
            creator: eventData[tokenId].creator
        });
    }

    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Get total number of tokens minted
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    // Array to store all event codes for enumeration
    string[] private allEventCodes;
    
    // Mapping from creator to array of event codes they created
    mapping(address => string[]) private creatorEvents;
    
    /**
     * @dev Get all event codes (for enumeration)
     */
    function getAllEventCodes() public view returns (string[] memory) {
        return allEventCodes;
    }
    
    /**
     * @dev Get all events created by an address
     */
    function getEventsByCreator(address creator) public view returns (string[] memory) {
        return creatorEvents[creator];
    }
    
    /**
     * @dev Get total number of events registered
     */
    function getTotalEvents() public view returns (uint256) {
        return allEventCodes.length;
    }
    
    /**
     * @dev Get event code by index
     */
    function getEventCodeByIndex(uint256 index) public view returns (string memory) {
        require(index < allEventCodes.length, "Index out of bounds");
        return allEventCodes[index];
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
