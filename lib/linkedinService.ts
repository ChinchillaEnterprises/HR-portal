"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import axios from 'axios';

const client = generateClient<Schema>();

interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
}

interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  summary?: string;
  location?: {
    name: string;
    country: string;
  };
  profilePicture?: string;
  publicProfileUrl?: string;
  experience?: LinkedInExperience[];
  education?: LinkedInEducation[];
  skills?: string[];
}

interface LinkedInExperience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrent: boolean;
}

interface LinkedInEducation {
  school: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  activities?: string;
}

export class LinkedInService {
  private static config: LinkedInConfig | null = null;
  private static baseUrl = 'https://api.linkedin.com/v2';

  /**
   * Initialize LinkedIn configuration
   */
  static initialize(config: LinkedInConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(state: string): string {
    if (!this.config) {
      throw new Error('LinkedIn not configured');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: 'r_liteprofile r_emailaddress w_member_social',
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<{
    success: boolean;
    accessToken?: string;
    expiresIn?: number;
    error?: string;
  }> {
    try {
      if (!this.config) {
        throw new Error('LinkedIn not configured');
      }

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.config.accessToken = response.data.access_token;

      return {
        success: true,
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      console.error('Error exchanging LinkedIn code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to exchange code',
      };
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(accessToken?: string): Promise<{
    success: boolean;
    profile?: LinkedInProfile;
    error?: string;
  }> {
    try {
      const token = accessToken || this.config?.accessToken;
      if (!token) {
        throw new Error('No access token available');
      }

      // Get basic profile
      const profileResponse = await axios.get(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          projection: '(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
        },
      });

      // Get email
      const emailResponse = await axios.get(
        `${this.baseUrl}/emailAddress?q=members&projection=(elements*(handle~))`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const profileData = profileResponse.data;
      const emailData = emailResponse.data;

      const profile: LinkedInProfile = {
        id: profileData.id,
        firstName: profileData.firstName.localized.en_US,
        lastName: profileData.lastName.localized.en_US,
        email: emailData.elements[0]['handle~'].emailAddress,
        profilePicture: this.extractProfilePicture(profileData.profilePicture),
      };

      return {
        success: true,
        profile,
      };
    } catch (error) {
      console.error('Error fetching LinkedIn profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
      };
    }
  }

  /**
   * Import profile to create/update applicant
   */
  static async importProfileToApplicant(
    accessToken: string
  ): Promise<{
    success: boolean;
    applicantId?: string;
    error?: string;
  }> {
    try {
      // Get profile data
      const profileResult = await this.getProfile(accessToken);
      if (!profileResult.success || !profileResult.profile) {
        throw new Error(profileResult.error || 'Failed to get profile');
      }

      const profile = profileResult.profile;

      // Check if applicant already exists
      const existingApplicants = await client.models.Applicant.list({
        filter: {
          email: { eq: profile.email },
        },
      });

      let applicantId: string;

      if (existingApplicants.data && existingApplicants.data.length > 0) {
        // Update existing applicant
        const existing = existingApplicants.data[0];
        const updated = await client.models.Applicant.update({
          id: existing.id,
          linkedinUrl: `https://www.linkedin.com/in/${profile.id}`,
          profileImageUrl: profile.profilePicture,
        });

        applicantId = existing.id;
        console.log(`✅ Updated existing applicant from LinkedIn: ${profile.email}`);
      } else {
        // Create new applicant
        const newApplicant = await client.models.Applicant.create({
          fullName: `${profile.firstName} ${profile.lastName}`,
          email: profile.email,
          linkedinUrl: `https://www.linkedin.com/in/${profile.id}`,
          profileImageUrl: profile.profilePicture,
          status: 'applied',
          source: 'linkedin',
        });

        if (!newApplicant.data) {
          throw new Error('Failed to create applicant');
        }

        applicantId = newApplicant.data.id;
        console.log(`✅ Created new applicant from LinkedIn: ${profile.email}`);
      }

      return {
        success: true,
        applicantId,
      };
    } catch (error) {
      console.error('Error importing LinkedIn profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import profile',
      };
    }
  }

  /**
   * Verify LinkedIn profile URL
   */
  static async verifyProfileUrl(
    profileUrl: string
  ): Promise<{
    valid: boolean;
    profileId?: string;
    error?: string;
  }> {
    try {
      // Extract profile ID from URL
      const urlPattern = /linkedin\.com\/in\/([a-zA-Z0-9-]+)/;
      const match = profileUrl.match(urlPattern);

      if (!match) {
        return {
          valid: false,
          error: 'Invalid LinkedIn profile URL format',
        };
      }

      const profileId = match[1];

      // In a real implementation, you might want to verify this with LinkedIn API
      // For now, we'll just validate the format
      return {
        valid: true,
        profileId,
      };
    } catch (error) {
      console.error('Error verifying LinkedIn profile:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to verify profile',
      };
    }
  }

  /**
   * Parse resume text for LinkedIn profile
   */
  static extractLinkedInFromResume(resumeText: string): string | null {
    const patterns = [
      /linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
      /linkedin:\s*(https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
      /linkedin profile:\s*(https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = resumeText.match(pattern);
      if (match) {
        const profileId = match[2] || match[1];
        return `https://www.linkedin.com/in/${profileId}`;
      }
    }

    return null;
  }

  /**
   * Share on LinkedIn
   */
  static async shareOnLinkedIn(
    content: {
      text: string;
      title?: string;
      description?: string;
      url?: string;
      imageUrl?: string;
    },
    accessToken?: string
  ): Promise<{
    success: boolean;
    postId?: string;
    error?: string;
  }> {
    try {
      const token = accessToken || this.config?.accessToken;
      if (!token) {
        throw new Error('No access token available');
      }

      // Get user URN
      const profileResult = await this.getProfile(token);
      if (!profileResult.success || !profileResult.profile) {
        throw new Error('Failed to get profile');
      }

      const authorUrn = `urn:li:person:${profileResult.profile.id}`;

      // Create share content
      const shareContent: any = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content.text,
            },
            shareMediaCategory: content.url ? 'ARTICLE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      // Add article if URL provided
      if (content.url) {
        shareContent.specificContent['com.linkedin.ugc.ShareContent'].media = [
          {
            status: 'READY',
            description: {
              text: content.description || '',
            },
            originalUrl: content.url,
            title: {
              text: content.title || '',
            },
          },
        ];
      }

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        shareContent,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      return {
        success: true,
        postId: response.data.id,
      };
    } catch (error) {
      console.error('Error sharing on LinkedIn:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to share',
      };
    }
  }

  /**
   * Search for companies
   */
  static async searchCompanies(
    query: string,
    accessToken?: string
  ): Promise<{
    success: boolean;
    companies?: Array<{
      id: string;
      name: string;
      logo?: string;
      industry?: string;
      size?: string;
    }>;
    error?: string;
  }> {
    try {
      const token = accessToken || this.config?.accessToken;
      if (!token) {
        throw new Error('No access token available');
      }

      // Note: Company search requires additional permissions
      // This is a simplified example
      const response = await axios.get(
        `${this.baseUrl}/companiesV2`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          params: {
            q: 'search',
            keywords: query,
            projection: '(id,name,logoV2,industries,staffCountRange)',
          },
        }
      );

      const companies = response.data.elements.map((company: any) => ({
        id: company.id,
        name: company.name,
        logo: company.logoV2?.original,
        industry: company.industries?.[0],
        size: company.staffCountRange,
      }));

      return {
        success: true,
        companies,
      };
    } catch (error) {
      console.error('Error searching companies:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search companies',
      };
    }
  }

  /**
   * Create job posting (requires additional permissions)
   */
  static async createJobPosting(
    job: {
      title: string;
      description: string;
      company: string;
      location: string;
      employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
    },
    accessToken?: string
  ): Promise<{
    success: boolean;
    jobId?: string;
    jobUrl?: string;
    error?: string;
  }> {
    // Note: This requires LinkedIn Talent Solutions API access
    // which has additional requirements and costs
    return {
      success: false,
      error: 'Job posting requires LinkedIn Talent Solutions API access',
    };
  }

  /**
   * Extract profile picture URL
   */
  private static extractProfilePicture(profilePicture: any): string | undefined {
    try {
      const displayImage = profilePicture?.['displayImage~'];
      if (displayImage?.elements?.length > 0) {
        const images = displayImage.elements[0].identifiers;
        if (images?.length > 0) {
          return images[0].identifier;
        }
      }
    } catch (error) {
      console.error('Error extracting profile picture:', error);
    }
    return undefined;
  }

  /**
   * Generate LinkedIn button HTML
   */
  static getLinkedInButton(type: 'signin' | 'apply'): string {
    const buttonText = type === 'signin' ? 'Sign in with LinkedIn' : 'Apply with LinkedIn';
    return `
      <a href="#" class="linkedin-button" style="
        display: inline-flex;
        align-items: center;
        padding: 10px 20px;
        background-color: #0077b5;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        transition: background-color 0.2s;
      " onmouseover="this.style.backgroundColor='#006399'" onmouseout="this.style.backgroundColor='#0077b5'">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="white" style="margin-right: 8px;">
          <path d="M18.5 0h-17C.7 0 0 .7 0 1.5v17c0 .8.7 1.5 1.5 1.5h17c.8 0 1.5-.7 1.5-1.5v-17C20 .7 19.3 0 18.5 0zM6 17H3V8h3v9zM4.5 6.3c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8 1.8.8 1.8 1.8-.8 1.8-1.8 1.8zM17 17h-3v-4.4c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4V17h-3V8h2.9v1.3h0c.4-.7 1.3-1.5 2.7-1.5 2.9 0 3.4 1.9 3.4 4.4V17z"/>
        </svg>
        ${buttonText}
      </a>
    `;
  }
}