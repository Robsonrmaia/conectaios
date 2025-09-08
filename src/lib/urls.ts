/**
 * URL utilities for minisite generation and sharing
 * Uses production domain (conectaios.com.br) in production and sandbox for development
 */

/**
 * Get the base URL for the application
 * Uses PUBLIC_BASE_URL which forces production domain on Lovable
 */
import { PUBLIC_BASE_URL } from '@/config/publicBaseUrl';

export const getBaseUrl = (): string => {
  return PUBLIC_BASE_URL;
};

/**
 * Generate a complete minisite URL for a broker
 * @param username - The broker's username
 * @returns Complete URL like https://www.conectaios.com.br/broker/username
 */
export const generateMinisiteUrl = (username: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/broker/${username}`;
};

/**
 * Generate a relative minisite path for internal routing
 * @param username - The broker's username  
 * @returns Relative path like /broker/username
 */
export const generateMinisitePath = (username: string): string => {
  return `/broker/${username}`;
};

/**
 * Generate property detail URL
 * @param propertyId - The property ID
 * @returns Complete property URL
 */
export const generatePropertyUrl = (propertyId: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/imovel/${propertyId}`;
};

/**
 * Clean and normalize username for URL usage
 * @param input - Raw username input
 * @returns Cleaned username suitable for URLs
 */
export const cleanUsername = (input: string): string => {
  return input.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
};

/**
 * Generate unique identifier from broker data
 * @param broker - Broker object with username and id
 * @returns Unique identifier for URL
 */
export const generateBrokerIdentifier = (broker: { username?: string; id: string }): string => {
  return broker.username || `broker-${broker.id.slice(0, 8)}`;
};